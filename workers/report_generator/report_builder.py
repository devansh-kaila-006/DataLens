"""
Report Builder Module
Generates professional reports in HTML, PDF, and JSON formats.
"""
import os
import logging
from typing import Dict, Any, Optional
from jinja2 import Template
import json
from datetime import datetime
import plotly.graph_objects as go
import plotly.express as px
import base64
from io import BytesIO

logger = logging.getLogger(__name__)


class ReportBuilder:
    """Builds professional reports in multiple formats."""

    def __init__(self):
        """Initialize report builder."""
        self.html_template = self._get_html_template()

    def generate_html_report(self, analysis_results: Dict[str, Any], dataset_name: str) -> str:
        """
        Generate HTML report.

        Args:
            analysis_results: Complete analysis results
            dataset_name: Name of the dataset

        Returns:
            HTML string
        """
        try:
            logger.info("Generating HTML report")

            # Compile all data
            context = self._build_report_context(analysis_results, dataset_name)

            # Render template
            html_content = self.html_template.render(**context)

            logger.info("HTML report generated successfully")
            return html_content

        except Exception as e:
            logger.error(f"Error generating HTML report: {e}")
            raise

    def generate_pdf_report(self, html_content: str) -> bytes:
        """
        Convert HTML to PDF using WeasyPrint.

        Args:
            html_content: HTML content

        Returns:
            PDF bytes
        """
        try:
            from weasyprint import HTML, CSS

            logger.info("Converting HTML to PDF")

            # Create PDF
            html_doc = HTML(string=html_content)
            pdf_bytes = html_doc.write_pdf()

            logger.info("PDF generated successfully")
            return pdf_bytes

        except Exception as e:
            logger.error(f"Error generating PDF: {e}")
            raise

    def generate_json_report(self, analysis_results: Dict[str, Any], dataset_name: str) -> str:
        """
        Generate JSON report.

        Args:
            analysis_results: Complete analysis results
            dataset_name: Name of the dataset

        Returns:
            JSON string
        """
        try:
            logger.info("Generating JSON report")

            report_data = {
                'dataset_name': dataset_name,
                'generated_at': datetime.utcnow().isoformat(),
                'analysis_results': analysis_results
            }

            json_content = json.dumps(report_data, indent=2, default=str)

            logger.info("JSON report generated successfully")
            return json_content

        except Exception as e:
            logger.error(f"Error generating JSON report: {e}")
            raise

    def _build_report_context(self, analysis_results: Dict[str, Any], dataset_name: str) -> Dict[str, Any]:
        """Build context for template rendering."""
        summary = analysis_results.get('summary', {})
        statistics = analysis_results.get('statistics', {})
        correlations = analysis_results.get('correlations', {})
        quality = analysis_results.get('data_quality', {})
        ml_readiness = analysis_results.get('ml_readiness', {})
        ai_insights = analysis_results.get('ai_insights', {})

        return {
            'dataset_name': dataset_name,
            'generated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
            'summary': summary,
            'statistics': statistics,
            'correlations': correlations.get('correlations', [])[:10],  # Top 10
            'quality': quality,
            'ml_readiness': ml_readiness,
            'ai_insights': ai_insights,
            'has_ai_insights': bool(ai_insights)
        }

    def _get_html_template(self) -> Template:
        """Get HTML template for report generation."""
        template_html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EDA Report - {{ dataset_name }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
        }
        .header .subtitle {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-card h3 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
        }
        .metric-card p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .insight-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .insight-box h4 {
            margin: 0 0 10px 0;
            color: #92400e;
        }
        .quality-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 5px;
        }
        .quality-high { background: #d1fae5; color: #065f46; }
        .quality-medium { background: #fef3c7; color: #92400e; }
        .quality-low { background: #fee2e2; color: #991b1b; }
        .correlation-item {
            padding: 10px;
            margin: 5px 0;
            background: #f9fafb;
            border-radius: 4px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
        }
        .recommendation {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Exploratory Data Analysis Report</h1>
            <div class="subtitle">
                <strong>Dataset:</strong> {{ dataset_name }} |
                <strong>Generated:</strong> {{ generated_at }}
            </div>
        </div>

        <!-- Summary Section -->
        <div class="section">
            <h2>📈 Dataset Overview</h2>
            <div class="metric-grid">
                <div class="metric-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <h3>{{ summary.total_rows or 0 }}</h3>
                    <p>Total Rows</p>
                </div>
                <div class="metric-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <h3>{{ summary.total_columns or 0 }}</h3>
                    <p>Total Columns</p>
                </div>
                <div class="metric-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <h3>{{ summary.numerical_columns or 0 }}</h3>
                    <p>Numerical</p>
                </div>
                <div class="metric-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <h3>{{ summary.categorical_columns or 0 }}</h3>
                    <p>Categorical</p>
                </div>
            </div>

            {% if summary.missing_values %}
            <div style="margin-top: 20px;">
                <h4>Missing Values:</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Column</th>
                            <th>Missing Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for col, count in summary.missing_values.items() %}
                        <tr>
                            <td>{{ col }}</td>
                            <td>{{ count }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
            {% endif %}
        </div>

        <!-- Data Quality Section -->
        <div class="section">
            <h2>✅ Data Quality Assessment</h2>
            <div class="metric-grid">
                <div class="metric-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    <h3>{{ quality.completeness.missing_percentage|round(1) }}%</h3>
                    <p>Missing Data</p>
                </div>
                <div class="metric-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
                    <h3>{{ quality.uniqueness.duplicate_percentage|round(1) }}%</h3>
                    <p>Duplicates</p>
                </div>
            </div>

            {% if ml_readiness %}
            <div style="margin-top: 20px;">
                <h3>ML Readiness Score: <span class="quality-badge {% if ml_readiness.overall_score >= 80 %}quality-high{% elif ml_readiness.overall_score >= 60 %}quality-medium{% else %}quality-low{% endif %}">
                    {{ ml_readiness.overall_score|round(1) }}/100
                </span></h3>
                <p><strong>Readiness Level:</strong> {{ ml_readiness.readiness_level|title }}</p>

                {% if ml_readiness.recommendations %}
                <h4>Recommendations:</h4>
                {% for rec in ml_readiness.recommendations %}
                <div class="recommendation">
                    • {{ rec }}
                </div>
                {% endfor %}
                {% endif %}
            </div>
            {% endif %}
        </div>

        <!-- Correlations Section -->
        {% if correlations %}
        <div class="section">
            <h2>🔗 Top Correlations</h2>
            {% for corr in correlations[:5] %}
            <div class="correlation-item">
                <strong>{{ corr.col1 }}</strong> vs <strong>{{ corr.col2 }}</strong>:
                <span style="color: {% if corr.correlation > 0 %}#10b981{% else %}#ef4444{% endif %}; font-weight: bold;">
                    {{ corr.correlation|round(3) }}
                </span>
            </div>
            {% endfor %}
        </div>
        {% endif %}

        <!-- AI Insights Section -->
        {% if has_ai_insights %}
        <div class="section">
            <h2>🤖 AI-Powered Insights</h2>

            {% if ai_insights.narrative %}
            <div class="insight-box">
                <h4>Executive Summary</h4>
                <p>{{ ai_insights.narrative }}</p>
            </div>
            {% endif %}

            {% if ai_insights.quality_recommendations %}
            <h3>Quality Recommendations</h3>
            {% for rec in ai_insights.quality_recommendations %}
            <div class="recommendation">
                • {{ rec }}
            </div>
            {% endfor %}
            {% endif %}
        </div>
        {% endif %}

        <!-- Statistics Section -->
        {% if statistics.numerical %}
        <div class="section">
            <h2>📊 Statistical Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>Mean</th>
                        <th>Median</th>
                        <th>Std Dev</th>
                        <th>Min</th>
                        <th>Max</th>
                    </tr>
                </thead>
                <tbody>
                    {% for col, stats in statistics.numerical.items() %}
                    <tr>
                        <td><strong>{{ col }}</strong></td>
                        <td>{{ stats.mean|round(2) }}</td>
                        <td>{{ stats.median|round(2) }}</td>
                        <td>{{ stats.std|round(2) }}</td>
                        <td>{{ stats.min|round(2) }}</td>
                        <td>{{ stats.max|round(2) }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        {% endif %}

        <div class="footer">
            <p>Generated by DataLens - Automated EDA Platform</p>
            <p style="font-size: 12px; margin-top: 5px;">
                This report was automatically generated using advanced statistical analysis and AI-powered insights.
            </p>
        </div>
    </div>
</body>
</html>
        """

        return Template(template_html)