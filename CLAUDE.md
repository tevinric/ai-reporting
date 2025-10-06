You are a python backend and react front end specialist agentic team that is responsible for creating an AI reporting application that will be used to capture, view, track and report on all AI initiatives within TIH. 

The application requirements:

1. The application will be used by multiple people across the organisation with no technical expertise so the application must be simple and intuitive. 
2. The application must allow for:
    - Capturing of new AI initiatives
    - Viewing all and specific initiatives in details
    - Updating an initiative
    - Deleting an initiative
    - Allow for for full CRUD operations on any initiative
3. Must have a landing page dashboard to provide high level information of statistics related to all AI initiatives
4. Must be able to drill down into specific initiatives for for information from the dashboard view
5. Must have a project view to view important project metrics on the status of the project and other important metrics. 
6. Must show progress indicators and movements between current month and previous month on each project
7. Must have a page for featured solutions where monthly this page will provide a summary and details of the initiatives that are in progress


Front end requirements:

1. Design in react to work with Python end
2. The front end must be professiona and visually appealing using neat elements, drop downs, text fields and data validation where possible
3. Include a side bar that will have different pages. The AIM of this dashboard is to report back to executives and project managers. So always have a helicopter view that users can drill down to get more detail


Back end requirements:
1. Develop in python
2. All data to support the application will be logged to a SQL database. Use pyodbc to manage DB connections
3. All APIS must work seemlessly with the front end to enable full CRUD operations on all pages of the application (where required)


Reference project:

Please refer to the /projects/email_traiging_sqa folder to see how another project had this front end and backend implemented. Only use this as a guideline for how the front end and backend shouuld be built. DO NOT use the same style of this application but refer to it only for the technical implementation. 


Data capturing fields:

- Use case name (The name/title of the AI initiative)
- Desription (A detailed description of the project)
- Benefit (Drop down selection):
    - Customer experience
    - Productivity
    - Customer Enablement
    (Allow for users to add a new option which will then become available for new selections)
- Strategic objection:
    - Customer Experience
    - Efficiency
    - Enablement
- Status:
    - Ideation
    - In Progress
    - Live (Complete)
- Percentage complete overall (overall completion status of initiative)
- Department (multiselect, allow for new department to be added as well)
    - Sales
    - Collections
    - Claims
    - Customer
    - GIT
    - Data Science
- Process Owner (Text input but show previous options to allow quick select)
- Business Owner (Text input but show previous options to allow quick select)
- Metrics: (Each metric must have a comments and details field)
    - Customer Experience Improvement (This is an important metric to report on. Please help us quantity this using your knowledge and practises)
    - Time saved: 
        - Allow user to put in time saved in any format (these must all be normalised to hours per month. Ensure validation and help the user with selections)
    - Cost saved (Rands per mnonth. Help the user quantify this with selections)
    - Revenue increase (Rands per mnonth. Help the user quantify this with selections)
    - Number of processed units
    
    - You must please include other important metrics for AI reporting  that are neccessary but not mentioned above. Use your expertise to define what ROI metrics will need to be measured and monitored for reporting back to executives
    - You must allow users to capture results on a monthly basis related to these metrics for EACH initiative so that we can trend the ROI for each initiatives.
    - Please include metrics for measuring ROI quantitatively or if there is not quantitative value then create metrics that will enable qualitative ROI tracking


- User name (person who logged the initaitive)
- User email address (person who logged the initiative)
- Last modified timestamp
- Last modified by name
- Last modified by email address


- You must also include other useful fields that will help us track and monitor the AI initiative progress and details. Remember this will be an application that provides information adn details for AI reporting. Use your discretion to determine what to include.

- You must also guide the users in what to capture for the ROI metrics. Create something that will provide guided assistance in helping the user capture the details for the AI initiative. 


Management View:

- This is a view of the data fields available for capturing information related to the AI initiaves with a description of each
- For each field show the available options under this field (if a dropdown or selection option.)
- You must allow users to manage and add/update or remove options in this view (Example if a new benefit category needs to be added, the user can add it here and it will become available in the application for users to select when a new initiative is captured)
- Please ensure that if a user updates a category, then all records with same category get updated as well. 
- If a category is deleted, then leave all existing records with that catgory untouched for prosterity. 
- This will allow for dynamic evolvement of the data capturing process. 
- You must also allow users to capture new metrics and define submetrics for tracking that will be become available


Output requirements: 

- Create two folders with all required files for each:
    - backend (All backend files, including the requirements, dockerfile, etc)
    - frontend (All frontend files, same as above)

- Working application

- Professional UI with full integrated backend

- SQL init script in the backend folder for all tables that need to be created (Use your discretion to determine what tables need to be created to enable the application)

- Dont worry about Entra Authentication - For the first pass user Tester as user name and test@tester.com as email address

- DO NOT USE EMOJIS or EMOTICONS in the front end as this is not professional. 

- Provide a full implementation guideline in the root folder to discuss how to setup and run the backend and front end. 

- Use Dockerfiles. Do not use Dockercompose.



