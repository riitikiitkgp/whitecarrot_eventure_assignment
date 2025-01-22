import datetime
import os.path
from flask import Flask, jsonify
from flask_cors import CORS 
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from tabulate import tabulate
from flask import Flask, jsonify, request 
from google.oauth2 import id_token
from google.auth.transport import requests 
from google.auth.transport.requests import Request
import requests 

SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly"
    # "https://www.googleapis.com/auth/userinfo.profile"
]

def fetch_events_by_date(service, target_date):
    """Fetches events from the user's primary calendar on a specific date."""
    start_datetime = datetime.datetime.strptime(target_date, "%d/%m/%Y")
    end_datetime = start_datetime + datetime.timedelta(days=1)
    time_min = start_datetime.isoformat() + "Z"
    time_max = end_datetime.isoformat() + "Z"

    events_result = service.events().list(
        calendarId="primary",
        timeMin=time_min,
        timeMax=time_max,
        maxResults=10,
        singleEvents=True,
        orderBy="startTime",
    ).execute()
    return events_result.get("items", [])

app = Flask(__name__)  
CORS(app)



@app.route('/profile', methods=['GET'])
def fetch_user_profile():
    """Fetches the user's profile information."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token is required"}), 400

    token = auth_header.split(' ')[1]  # Extract the token from the header

    try:
        # Verify the token
        id_info = id_token.verify_oauth2_token(token, Request(), "55463530723-tm7626m1lf3skr28h31suabsgovc2vad.apps.googleusercontent.com")
        # id_info = id_token.verify_oauth2_token(token, Request(), "29837102542-1qkh0ikmm5ar52jp3ev3oaf8clvvlbos.apps.googleusercontent.com")

        # Use the token to access the userinfo endpoint
        userinfo_endpoint = "https://www.googleapis.com/oauth2/v1/userinfo"
        response = requests.get(userinfo_endpoint, headers={'Authorization': f'Bearer {token}'})
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch user profile"}), response.status_code
        
        user_info = response.json()
        return jsonify(user_info)
    except ValueError as e:
        # Invalid token
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from google.auth.transport.requests import Request
from google.oauth2 import id_token

@app.route('/events', methods=['GET'])
def fetch_all_events():
    """Fetches all events from the user's primary calendar."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token is required"}), 400

    token = auth_header.split(' ')[1]  # Extract the token from the header
    page_token = request.args.get('pageToken')  # Get the page token from the request
    start_date = request.args.get('startDate')  # Get the start date from the request
    end_date = request.args.get('endDate')  # Get the end date from the request

    try:
        # Verify the token
        # id_info = id_token.verify_oauth2_token(token, Request(), "55463530723-tm7626m1lf3skr28h31suabsgovc2vad.apps.googleusercontent.com")
        id_info = id_token.verify_oauth2_token(token, Request(), "29837102542-1qkh0ikmm5ar52jp3ev3oaf8clvvlbos.apps.googleusercontent.com")
        
        service = authenticate_google_calendar()  

        # Set timeMin and timeMax based on startDate and endDate
        time_min = f"{start_date}T00:00:00Z" if start_date else "0000-01-01T00:00:00Z"
        time_max = f"{end_date}T23:59:59Z" if end_date else "3000-12-31T23:59:59Z"
        print(f"Fetching events with timeMin: {time_min}, timeMax: {time_max}, pageToken: {page_token}")
        events_result = service.events().list(
            calendarId="primary",
            maxResults=50,
            singleEvents=True,
            orderBy="startTime",
            pageToken=page_token,
            timeMin=time_min,
            timeMax=time_max
        ).execute()
        events = events_result.get("items", [])
        next_page_token = events_result.get("nextPageToken")

        print(f"Fetched {len(events)} events, nextPageToken: {next_page_token}")

        return jsonify({"events": events, "nextPageToken": next_page_token})
    except ValueError as e:
        # Invalid token
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def display_events(events):
    """Displays events in a tabular format with name, date, time, and location."""
    if not events:
        print("No events found.")
        return

    table = []
    for event in events:
        event_name = event.get("summary", "No Title")

        start_iso = event["start"].get("dateTime", event["start"].get("date"))
        start_date = datetime.datetime.fromisoformat(start_iso.replace("Z", ""))
        date = start_date.strftime("%d/%m/%Y")
        time = start_date.strftime("%H:%M:%S") if "T" in start_iso else "All Day"

        location = event.get("location", "No Location")
        table.append([event_name, date, time, location])

    print(tabulate(table, headers=["Event Name", "Date", "Time", "Location"], tablefmt="grid"))

def authenticate_google_calendar():
    """Authenticates the Google Calendar API and ensures a valid token."""
    creds = None
    token_path = "token.json"
    credentials_path = "credentials.json"

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        print("Authenticating with Google Calendar API...")
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                raise FileNotFoundError("Missing 'credentials.json'. Ensure the file is present in the directory.")

            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=3000, prompt="consent")

        # Ensure the token has a refresh token
        if not creds.refresh_token:
            print("Warning: Missing refresh token. Re-authenticating to generate a new token.")
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=3000, prompt="consent")

        with open(token_path, "w") as token:
            token.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)

def main():
    try:
        service = authenticate_google_calendar()

        print("Choose an option:")
        print("1. Fetch all events")
        print("2. Fetch events on a specific date")
        choice = input("Enter your choice (1 or 2): ")

        if choice == "1":
            print("Fetching all events...")
            events = fetch_all_events(service)
        elif choice == "2":
            target_date = input("Enter the date (dd/mm/yyyy): ")
            print(f"Fetching events on {target_date}...")
            events = fetch_events_by_date(service, target_date)
        else:
            print("Invalid choice!")
            return

        display_events(events)

    except FileNotFoundError as fnf_error:
        print(fnf_error)
    except HttpError as error:
        print(f"An error occurred: {error}")

@app.route("/", methods=['GET'])
def home():
    return "<h1>Eventure's Flask App</h1>"

if __name__ == "__main__":
    print("runnning backend")
    # app.run(debug=True)
    app.run()
