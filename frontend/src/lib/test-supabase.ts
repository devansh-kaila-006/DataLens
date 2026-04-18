/**
 * Supabase Connection Test Utility
 * Run this to test your Supabase connection and setup
 */

import { supabase } from './supabase'

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n')

  const results = {
    connection: false,
    tables: false,
    rls: false,
    storage: false,
    functions: false
  }

  try {
    // Test 1: Connection
    console.log('📡 Test 1: Testing connection...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.log('⚠️  Not authenticated (this is OK for testing)')
    } else {
      console.log('✅ Connection successful!', user ? `User: ${user.email}` : 'No user logged in')
    }
    results.connection = true

    // Test 2: Check if tables exist
    console.log('\n📊 Test 2: Checking if tables exist...')
    const { data: tables, error: tablesError } = await supabase
      .from('analysis_jobs')
      .select('id')
      .limit(1)

    if (tablesError) {
      console.log('❌ Cannot access analysis_jobs table:', tablesError.message)
    } else {
      console.log('✅ analysis_jobs table accessible')
      results.tables = true
    }

    // Test 3: Check storage buckets
    console.log('\n📦 Test 3: Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()

    if (bucketsError) {
      console.log('❌ Cannot access storage:', bucketsError.message)
    } else {
      const bucketNames = buckets?.map(b => b.name) || []
      console.log('✅ Storage buckets:', bucketNames.join(', '))

      if (bucketNames.includes('uploads') && bucketNames.includes('reports')) {
        results.storage = true
        console.log('✅ Both required buckets exist')
      } else {
        console.log('⚠️  Missing buckets. Expected: uploads, reports')
      }
    }

    // Test 4: Test helper function (if authenticated)
    if (user) {
      console.log('\n🔧 Test 4: Testing helper functions...')
      const { data: userJobs, error: funcError } = await supabase
        .rpc('get_user_jobs')

      if (funcError) {
        console.log('❌ Helper function failed:', funcError.message)
      } else {
        console.log('✅ Helper function works! Found jobs:', userJobs?.length || 0)
        results.functions = true
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))

    const passed = Object.values(results).filter(v => v).length
    const total = Object.keys(results).length

    console.log(`Passed: ${passed}/${total} tests`)

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '⚠️'}  ${test}`)
    })

    if (passed === total) {
      console.log('\n🎉 All tests passed! Supabase is ready.')
    } else {
      console.log('\n⚠️  Some tests failed. Check the migration scripts.')
    }

    return results

  } catch (error) {
    console.error('❌ Test failed:', error)
    return results
  }
}

// Auto-run when imported
if (typeof window !== 'undefined') {
  console.log('🧪 Supabase test utility loaded')
  console.log('Run: testSupabaseConnection() in browser console')
}
