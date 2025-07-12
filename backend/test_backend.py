
#!/usr/bin/env python3
"""
Backend testing script to verify all endpoints are working
"""
import requests
import json
import os
import time
from datetime import datetime

BASE_URL = 'http://localhost:8000/api'

def test_health_check():
    """Test health check endpoint"""
    try:
        response = requests.get(f'{BASE_URL}/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health Check: OK")
            print(f"   Status: {data['status']}")
            print(f"   Message: {data['message']}")
            return True
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
        return False

def test_get_leads():
    """Test get all leads endpoint"""
    try:
        response = requests.get(f'{BASE_URL}/leads', timeout=10)
        if response.status_code == 200:
            leads = response.json()
            print(f"✅ Get Leads: OK ({len(leads)} leads found)")
            return True, leads
        else:
            print(f"❌ Get Leads Failed: {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Get Leads Error: {e}")
        return False, []

def test_add_lead():
    """Test add lead endpoint"""
    try:
        test_lead = {
            'name': 'Test User',
            'email': f'test_{int(time.time())}@example.com',
            'phone': '+1234567890',
            'status': 'New',
            'source': 'Manual'
        }
        
        response = requests.post(f'{BASE_URL}/leads', 
                               json=test_lead, 
                               headers={'Content-Type': 'application/json'},
                               timeout=10)
        
        if response.status_code == 200:
            lead = response.json()
            print(f"✅ Add Lead: OK (ID: {lead['id']})")
            return True, lead
        else:
            print(f"❌ Add Lead Failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Add Lead Error: {e}")
        return False, None

def test_workflow_execution():
    """Test workflow execution endpoint"""
    try:
        # First get some leads
        success, leads = test_get_leads()
        if not success or not leads:
            print("⚠️  Workflow Test: No leads available for testing")
            return True
        
        # Test status update workflow
        lead_ids = [lead['id'] for lead in leads[:2]]  # Test with first 2 leads
        workflow_data = {
            'action': 'update_status',
            'leadIds': lead_ids,
            'status': 'Contacted'
        }
        
        response = requests.post(f'{BASE_URL}/workflow/execute', 
                               json=workflow_data, 
                               headers={'Content-Type': 'application/json'},
                               timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Workflow Execution: OK ({result['processedLeads']} leads processed)")
            return True
        else:
            print(f"❌ Workflow Execution Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Workflow Execution Error: {e}")
        return False

def main():
    """Run all backend tests"""
    print("🧪 Testing Lead Management FastAPI Backend")
    print("=" * 50)
    
    # Check if server is running
    try:
        requests.get(f'{BASE_URL}/health', timeout=5)
    except Exception:
        print("❌ Backend server is not running!")
        print("Please start the server with: python main.py")
        return
    
    test_results = []
    
    # Run tests
    print("\n1. Testing Health Check...")
    test_results.append(test_health_check())
    
    print("\n2. Testing Get Leads...")
    success, leads = test_get_leads()
    test_results.append(success)
    
    print("\n3. Testing Add Lead...")
    success, new_lead = test_add_lead()
    test_results.append(success)
    
    print("\n4. Testing Workflow Execution...")
    test_results.append(test_workflow_execution())
    
    # Summary
    print("\n" + "=" * 50)
    print("🏁 Test Summary")
    print("=" * 50)
    
    passed = sum(test_results)
    total = len(test_results)
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")
    
    print("\n💡 Notes:")
    print("- Email tests may show 'not configured' - this is expected if Gmail SMTP is not set up")
    print("- File upload tests require manual testing with actual files")

if __name__ == '__main__':
    main()
