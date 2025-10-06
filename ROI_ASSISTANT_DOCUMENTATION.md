# ROI Assistant Implementation Documentation

## Overview

The ROI Assistant is a new tool added to the AI Reporting application that helps users determine the right metrics to measure Return on Investment (ROI) for their AI and RPA initiatives. It uses OpenAI's GPT-4 model to provide personalized, professional recommendations based on user inputs.

## Features

- **Interactive Chat Interface**: Guides users through a series of questions to collect information about their initiative
- **Intelligent Questioning**: Asks directed questions with predefined options to ensure accurate data collection
- **OpenAI Integration**: Leverages GPT-4 to generate comprehensive ROI recommendations
- **Professional Output**: Ensures all recommendations are professional and suitable for executive reporting (no emojis)
- **South African Insurance Context**: Tailored specifically for the South African insurance market
- **Database Tracking**: Saves all conversations for future reference and analysis

## Implementation Details

### Frontend Components

#### 1. ROI Assistant Page (`frontend/src/pages/ROIAssistant.js`)
- Chat-based interface with message history
- Sequential question flow with dropdown selections
- Real-time message updates with typing indicators
- Professional styling without emojis
- Reset functionality to start new conversations

#### 2. Styling (`frontend/src/pages/ROIAssistant.css`)
- Clean, modern chat interface
- Responsive design
- Smooth animations and transitions
- Distinct styling for user and assistant messages
- Professional color scheme

### Backend Implementation

#### 1. API Endpoint (`/api/roi-assistant`)
- **Method**: POST
- **Purpose**: Receives user responses and returns ROI recommendations from OpenAI
- **Request Body**: JSON object containing user responses to all questions
- **Response**: JSON object with recommendation text

#### 2. OpenAI Integration
- Uses GPT-4 Turbo Preview model
- Professional system prompt ensures quality output
- Comprehensive user prompt with all collected data
- Temperature set to 0.7 for balanced creativity and consistency
- Maximum 2000 tokens for detailed responses

### Database Schema

#### ROI Conversations Table (`roi_conversations`)
```sql
CREATE TABLE dbo.roi_conversations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_responses NVARCHAR(MAX) NOT NULL,      -- JSON object with all user responses
    llm_recommendation NVARCHAR(MAX) NOT NULL,   -- LLM generated recommendation
    created_at DATETIME DEFAULT GETDATE(),
    created_by_name NVARCHAR(255),
    created_by_email NVARCHAR(255)
);
```

## Question Flow

The ROI Assistant asks the following questions in sequence:

1. **Initiative Type**
   - AI Initiative
   - RPA Initiative

2. **Value Type**
   - Time Saving
   - Cost Reduction
   - Revenue Generation
   - Productivity Enhancement
   - Customer Experience Improvement
   - Risk Mitigation
   - Compliance & Governance
   - Multiple Value Types

3. **Implementation Scale**
   - Pilot (Single department/process)
   - Medium (Multiple departments)
   - Enterprise-wide (Organization-wide)

4. **Units Processed**
   - Less than 100
   - 100 - 1,000
   - 1,000 - 10,000
   - 10,000 - 100,000
   - More than 100,000

5. **Current Process Status**
   - Fully Manual
   - Partially Automated
   - Legacy System
   - No Current Process (New Capability)

6. **Success Metrics**
   - Quantitative Metrics Only
   - Qualitative Metrics Only
   - Both Quantitative and Qualitative

7. **ROI Timeline**
   - Immediate (Within 1 month)
   - Short-term (1-3 months)
   - Medium-term (3-6 months)
   - Long-term (6-12 months)
   - Extended (More than 12 months)

8. **Industry Challenges**
   - Claims Processing
   - Underwriting & Risk Assessment
   - Customer Onboarding
   - Fraud Detection
   - Policy Administration
   - Customer Service & Support
   - Regulatory Compliance
   - Data Quality & Management
   - Other/Multiple Areas

## LLM Prompt Structure

The recommendation includes:

1. **Recommended ROI Metrics**
   - Specific quantitative and qualitative metrics
   - Explanation of relevance for each metric

2. **Data Compilation Guidance**
   - Step-by-step data collection instructions
   - South African insurance market examples
   - Simple, non-technical language

3. **Measurement Framework**
   - Measurement frequency recommendations
   - Baseline establishment guidance
   - Simple formulas and calculations

4. **Additional Recommendations**
   - South African insurance industry considerations
   - Complementary metrics suggestions
   - Tips for accurate ROI measurement

## Setup Instructions

### 1. Environment Configuration

Add your OpenAI configuration to the backend `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Note**: The `OPENAI_BASE_URL` is separate from the React app's API base URL. This is the endpoint for OpenAI's API (or your custom proxy/Azure OpenAI endpoint).

### 2. Database Setup

Run the updated SQL initialization script to create the `roi_conversations` table:

```bash
# From the backend directory
sqlcmd -S localhost -d AIReporting -i sql_init_ai_reporting.sql
```

### 3. Install Dependencies

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

The updated `requirements.txt` includes:
- `openai==1.12.0`

#### Frontend
No additional dependencies needed. All frontend changes use existing packages.

### 4. Start the Application

#### Backend
```bash
cd backend
python app.py
```

#### Frontend
```bash
cd frontend
npm start
```

### 5. Access the ROI Assistant

Navigate to the application and click on "ROI Assistant" in the sidebar. The tool is located at `/tools/roi-assistant`.

## Usage Guide

1. **Open ROI Assistant**: Click on "ROI Assistant" in the navigation sidebar
2. **Answer Questions**: Select from the provided options for each question
3. **Review Recommendation**: After answering all questions, the LLM will generate a comprehensive recommendation
4. **Start New Conversation**: Use the "Start New Conversation" button to reset and begin again

## Key Design Principles

1. **No Technical Expertise Required**: All questions use simple language with clear options
2. **Professional Output**: No emojis or casual language in recommendations
3. **South African Context**: All recommendations consider the local insurance market
4. **Guided Experience**: Users can't skip questions or provide free-form text (except in LLM response)
5. **Executive-Ready**: Output is formatted for inclusion in executive reports

## Security Considerations

- OpenAI API key stored in environment variables (never in code)
- All conversations logged to database for audit purposes
- User information tracked using default test user credentials
- No sensitive data sent to OpenAI (only initiative characteristics)

## Future Enhancements

Potential improvements for future versions:

1. Add conversation history view
2. Allow users to export recommendations as PDF
3. Add ability to save recommendations to initiatives
4. Include cost calculator based on OpenAI token usage
5. Add analytics dashboard for ROI Assistant usage
6. Multi-language support (English and Afrikaans)
7. Integration with initiative creation workflow

## Troubleshooting

### Issue: "Failed to generate ROI recommendations"

**Solutions:**
- Verify OPENAI_API_KEY is correctly set in `.env` file
- Verify OPENAI_BASE_URL is correctly set (should be OpenAI API endpoint, not your React app URL)
- Check OpenAI account has sufficient credits
- Ensure backend server is running
- Check backend logs for detailed error messages
- If using Azure OpenAI or custom proxy, verify the base URL format is correct

### Issue: Chat not displaying properly

**Solutions:**
- Clear browser cache
- Verify frontend is running on correct port
- Check browser console for JavaScript errors
- Ensure all CSS files are properly loaded

### Issue: Database error when saving conversation

**Solutions:**
- Verify `roi_conversations` table exists
- Check database connection settings
- Ensure database user has INSERT permissions
- Note: This won't prevent recommendations from being shown, just logged

## Technical Notes

- **Model**: Uses `gpt-4-turbo-preview` (latest stable GPT-4 version)
- **Temperature**: 0.7 (balanced between consistency and creativity)
- **Max Tokens**: 2000 (sufficient for detailed recommendations)
- **Response Format**: Plain text with markdown-style formatting
- **Error Handling**: Graceful degradation if database save fails

## Files Modified/Created

### Created:
- `frontend/src/pages/ROIAssistant.js`
- `frontend/src/pages/ROIAssistant.css`
- `ROI_ASSISTANT_DOCUMENTATION.md`

### Modified:
- `frontend/src/App.js` (added route)
- `frontend/src/components/Navigation.js` (added menu item)
- `frontend/src/config/api.js` (added endpoint)
- `frontend/src/services/api.js` (added API function)
- `backend/app.py` (added endpoint and OpenAI integration)
- `backend/requirements.txt` (added openai package)
- `backend/.env.example` (added OPENAI_API_KEY)
- `backend/sql_init_ai_reporting.sql` (added roi_conversations table)

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs: `backend/app.log`
3. Check browser console for frontend errors
4. Verify OpenAI API status at status.openai.com
