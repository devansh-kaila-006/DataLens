/**
 * Custom SVG Icon System
 * Premium icon components for DataLens application
 */

import React from 'react'

interface IconProps {
  className?: string
  size?: number
  viewBox?: string
  children?: React.ReactNode
}

export const Icon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  viewBox = "0 0 24 24",
  children
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
)

// Security Icons
export const ShieldIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M12 2L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
)

export const LockIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
    <path d="M7 11V7C7 4.23864 9.23858 2 12 2C14.7614 2 17 4.23864 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

export const KeyIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M21 2L9 14L2 14L2 21L9 21L21 9M7 15L11 11M8 12L12 8M21 2L21 9M16.5 5.5C17.3284 5.5 18 4.82843 18 4C18 3.17157 17.3284 2.5 16.5 2.5C15.6716 2.5 15 3.17157 15 4C15 4.82843 15.6716 5.5 16.5 5.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
)

// Testing Icons
export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const XCircleIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

export const AlertTriangleIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M10.29 3.86L1.82 18C1.425 18.66 1.907 19.5 2.68 19.5H21.32C22.093 19.5 22.575 18.66 22.18 18L13.71 3.86C13.32 3.18 12.68 3.18 12.29 3.86Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

export const InfoIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

// Action Icons
export const UploadIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const DownloadIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const RefreshIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.49 15C20.1554 16.7428 19.2632 18.3229 17.9544 19.4779C16.6456 20.6329 14.9946 21.2954 13.2684 21.3623C11.5422 21.4291 9.84689 20.8967 8.45626 19.8464C7.06562 18.7961 6.05862 17.2874 5.59504 15.5814C5.13146 13.8754 5.24001 12.0663 5.90298 10.4296C6.56595 8.79284 7.74652 7.42312 9.26734 6.53914C10.7882 5.65515 12.5645 5.30869 14.303 5.55416C16.0415 5.79963 17.6486 6.62325 18.87 7.9L23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M12.22 2H11.78L11.53 2.63C11.4379 2.85979 11.2826 3.05769 11.0821 3.20084C10.8816 3.34399 10.6441 3.42664 10.3985 3.43916C10.1529 3.45168 9.90852 3.3935 9.69521 3.27156L9.09821 2.97021L8.77721 3.27379L9.09821 3.86105C9.25932 4.04083 9.36694 4.26264 9.40873 4.50074C9.45052 4.73883 9.42483 4.98397 9.33424 5.20792L9.08424 5.81447C8.97182 6.09236 8.77479 6.32975 8.52011 6.49434C8.26543 6.65893 7.96566 6.74248 7.66196 6.73408L6.99096 6.71671L6.82121 7.12884L7.39921 7.50537C7.59934 7.63692 7.75956 7.82183 7.86135 8.04019C7.96314 8.25855 8.00273 8.50119 7.97605 8.74158L7.92921 9.39574C7.89623 9.63467 7.7946 9.85889 7.63627 10.0411C7.47794 10.2233 7.26966 10.3561 7.03521 10.4236L6.39621 10.6056L6.39621 11.0544L7.03521 11.2364C7.26966 11.3039 7.47794 11.4367 7.63627 11.6189C7.7946 11.8011 7.89623 12.0253 7.92921 12.2643L7.97605 12.9184C8.00273 13.1588 7.96314 13.4014 7.86135 13.6198C7.75956 13.8382 7.59934 14.0231 7.39921 14.1546L6.82121 14.5312L6.99096 14.9433L7.66196 14.9259C7.96566 14.9175 8.26543 15.0011 8.52011 15.1657C8.77479 15.3303 8.97182 15.5676 9.08424 15.8455L9.33424 16.4521C9.42483 16.676 9.45052 16.9212 9.40873 17.1593C9.36694 17.3974 9.25932 17.6192 9.09821 17.7989L8.77721 18.3862L9.09821 18.6898L9.69521 18.3884C9.90852 18.2665 10.1529 18.2083 10.3985 18.2208C10.6441 18.2334 10.8816 18.316 11.0821 18.4592C11.2826 18.6023 11.4379 18.8002 11.53 19.03L11.78 19.66H12.22L12.47 19.03C12.5621 18.8002 12.7174 18.6023 12.9179 18.4592C13.1184 18.316 13.3559 18.2334 13.6015 18.2208C13.8471 18.2083 14.0915 18.2665 14.3048 18.3884L14.9018 18.6898L15.2228 18.3862L14.9018 17.7989C14.7407 17.6192 14.6331 17.3974 14.5913 17.1593C14.5495 16.9212 14.5752 16.676 14.6658 16.4521L14.9158 15.8455C15.0282 15.5676 15.2252 15.3303 15.4799 15.1657C15.7346 15.0011 16.0343 14.9175 16.338 14.9259L17.009 14.9433L17.1788 14.5312L16.6008 14.1546C16.4007 14.0231 16.2404 13.8382 16.1386 13.6198C16.0369 13.4014 15.9973 13.1588 16.0239 12.9184L16.0708 12.2643C16.1038 12.0253 16.2054 11.8011 16.3637 11.6189C16.5221 11.4367 16.7304 11.3039 16.9648 11.2364L17.6038 11.0544V10.6056L16.9648 10.4236C16.7304 10.3561 16.5221 10.2233 16.3637 10.0411C16.2054 9.85889 16.1038 9.63467 16.0708 9.39574L16.0239 8.74158C15.9973 8.50119 16.0369 8.25855 16.1386 8.04019C16.2404 7.82183 16.4007 7.63692 16.6008 7.50537L17.1788 7.12884L17.009 6.71671L16.338 6.73408C16.0343 6.74248 15.7346 6.65893 15.4799 6.49434C15.2252 6.32975 15.0282 6.09236 14.9158 5.81447L14.6658 5.20792C14.5752 4.98397 14.5495 4.73883 14.5913 4.50074C14.6331 4.26264 14.7407 4.04083 14.9018 3.86105L15.2228 3.27379L14.9018 2.97021L14.3048 3.27156C14.0915 3.3935 13.8471 3.45168 13.6015 3.43916C13.3559 3.42664 13.1184 3.34399 12.9179 3.20084C12.7174 3.05769 12.5621 2.85979 12.47 2.63L12.22 2ZM12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </Icon>
)

// Chart & Analytics Icons
export const ChartIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const PieChartIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M21.21 15.89C20.5739 17.6572 19.3816 19.1655 17.8117 20.1914C16.2418 21.2173 14.3752 21.7068 12.5066 21.5877C10.6379 21.4686 8.8538 20.7469 7.42698 19.5309C6.00017 18.3149 5.00541 16.6711 4.58776 14.8358C4.17012 13.0004 4.35268 11.0744 5.11878 9.35311C5.88488 7.6318 7.19169 6.20535 8.84129 5.2908C10.4909 4.37626 12.3934 4.0221 14.2522 4.28158C16.111 4.54107 17.8318 5.40048 19.17 6.73996L12 14L21.21 15.89Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
)

export const TrendingUpIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 6H23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

// User & Authentication Icons
export const UserIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M20 21C20 18.7909 16.4183 17 12 17C7.58172 17 4 18.7909 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="2" />
  </Icon>
)

export const SignOutIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

// Status Icons
export const ClockIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

export const ZapIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
)

export const TargetIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
  </Icon>
)

// File & Document Icons
export const FileIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M13 2V9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const DatabaseIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2" />
    <path d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12" stroke="currentColor" strokeWidth="2" />
    <path d="M3 5V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V5" stroke="currentColor" strokeWidth="2" />
  </Icon>
)

// Navigation Icons
export const MenuIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

export const CloseIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

// Loading Icon
export const LoadingIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
    <path
      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>
  </Icon>
)

// Analysis Icons
export const SearchIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

export const FilterIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

// Success/Error Icons
export const CheckIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const ErrorIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

// Special Testing Icons
export const FlaskIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M10 2V7.5M14 2V7.5M6 9L4 20H20L18 9M6 9H18M6 9L8.5 5.5M18 9L15.5 5.5M9 14H15M9 17H12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
)

export const CompassIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const DocumentIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
)

export const RocketIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M4.5 16.5C4.5 16.5 6.5 14.5 9 12.5M19.5 16.5C19.5 16.5 17.5 14.5 15 12.5M15 12.5L12 2L9 12.5M12 22V16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" />
  </Icon>
)
