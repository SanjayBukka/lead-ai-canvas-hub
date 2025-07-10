
#!/usr/bin/env python3
"""
Backend testing script to verify all endpoints are working
"""
import requests
import json
import os
import time
from datetime import datetime

BASE_URL = 'http://localhost:3001/api'

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
        
        if response.status_code == 201:
            lead = response.json()
            print(f"✅ Add Lead: OK (ID: {lead['id']})")
            return True, lead
        else:
            print(f"❌ Add Lead Failed: {response.status_code} - {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Add Lead Error: {e}")
        return False, None

def test_update_lead(lead_id):
    """Test update lead endpoint"""
    try:
        update_data = {
            'status': 'Contacted',
            'phone': '+0987654321'
        }
        
        response = requests.put(f'{BASE_URL}/leads/{lead_id}', 
                              json=update_data, 
                              headers={'Content-Type': 'application/json'},
                              timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Update Lead: OK")
            return True
        else:
            print(f"❌ Update Lead Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Update Lead Error: {e}")
        return False

def test_send_email(lead_id):
    """Test send email endpoint"""
    try:
        email_data = {
            'subject': 'Test Email from Backend',
            'message': 'This is a test email to verify the email functionality is working.'
        }
        
        response = requests.post(f'{BASE_URL}/leads/{lead_id}/email', 
                               json=email_data, 
                               headers={'Content-Type': 'application/json'},
                               timeout=30)
        
        if response.status_code == 200:
            print("✅ Send Email: OK")
            return True
        elif response.status_code == 500 and 'not configured' in response.json().get('message', ''):
            print("⚠️  Send Email: Email service not configured (expected)")
            return True
        else:
            print(f"❌ Send Email Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Send Email Error: {e}")
        return False

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

def test_ai_analysis():
    """Test AI analysis endpoint"""
    try:
        # Get a lead for testing
        success, leads = test_get_leads()
        if not success or not leads:
            print("⚠️  AI Analysis Test: No leads available for testing")
            return True
        
        lead_id = leads[0]['id']
        ai_data = {
            'leadId': lead_id,
            'query': 'Suggest follow-up actions for this lead'
        }
        
        response = requests.post(f'{BASE_URL}/ai/analyze', 
                               json=ai_data, 
                               headers={'Content-Type': 'application/json'},
                               timeout=30)
        
        if response.status_code == 200:
            analysis = response.json()
            print(f"✅ AI Analysis: OK (Score: {analysis['leadScore']})")
            return True
        else:
            print(f"❌ AI Analysis Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ AI Analysis Error: {e}")
        return False

def test_delete_lead(lead_id):
    """Test delete lead endpoint"""
    try:
        response = requests.delete(f'{BASE_URL}/leads/{lead_id}', timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Delete Lead: OK")
            return True
        else:
            print(f"❌ Delete Lead Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Delete Lead Error: {e}")
        return False

def main():
    """Run all backend tests"""
    print("🧪 Testing Lead Management Python Backend")
    print("=" * 50)
    
    # Check if server is running
    try:
        requests.get(f'{BASE_URL}/health', timeout=5)
    except Exception:
        print("❌ Backend server is not running!")
        print("Please start the server with: python app.py")
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
    
    if new_lead:
        print("\n4. Testing Update Lead...")
        test_results.append(test_update_lead(new_lead['id']))
        
        print("\n5. Testing Send Email...")
        test_results.append(test_send_email(new_lead['id']))
    
    print("\n6. Testing Workflow Execution...")
    test_results.append(test_workflow_execution())
    
    print("\n7. Testing AI Analysis...")
    test_results.append(test_ai_analysis())
    
    if new_lead:
        print("\n8. Testing Delete Lead...")
        test_results.append(test_delete_lead(new_lead['id']))
    
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
    print("- AI analysis is currently using placeholder responses")
    print("- File upload tests require manual testing with actual files")

if __name__ == '__main__':
    main()
