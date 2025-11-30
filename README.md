# AI-Powered Website with Intent Prediction

A comprehensive AI-powered website that tracks user behavior and uses machine learning to predict user intent in real-time. This project demonstrates advanced user analytics, AI predictions, and full GDPR compliance.

## 🎯 Project Overview

This project combines modern web technologies with artificial intelligence to create an intelligent user tracking and intent prediction system. The application analyzes user behavior patterns and predicts what brings users to the site with confidence scoring.

## ✨ Key Features

### 🔍 Real-Time User Tracking

- **Session Management**: Automatic session creation with unique IDs
- **Behavioral Analytics**: Click tracking, scroll depth monitoring, time on page
- **Device Detection**: Automatic device type identification (mobile/tablet/desktop)
- **Event Stream**: Live feed of user interactions with timestamps

### 🤖 AI-Powered Intent Prediction

- **8 Intent Categories**: Information, Research, Purchase, Learning, Entertainment, Navigation, Support, Comparison
- **Confidence Scoring**: Percentage confidence for each prediction (0-100%)
- **Secondary Intents**: Alternative predictions with confidence scores
- **Prediction Factors**: Human-readable explanations of AI decision-making
- **Real-Time Processing**: Instant predictions based on user behavior

### 📊 Advanced Analytics Dashboard

- **Live Metrics**: Active users, events per second, prediction accuracy
- **User Journey Analytics**: Comprehensive behavior analysis
- **Performance Metrics**: AI model accuracy, precision, and recall statistics
- **Visual Charts**: Progress bars and interactive data visualization

### 🔒 Privacy & GDPR Compliance

- **Data Rights**: View, update, export, and delete personal data
- **GDPR Compliant**: Full compliance with EU privacy regulations
- **Transparent Processing**: Clear information about data usage

### 💅 Professional Interface

- **Modern Design**: Beautiful, responsive interface built with React and Tailwind CSS
- **Mobile-Friendly**: Optimized for all device types
- **Real-Time Updates**: Live data updates every 5 seconds
- **Intuitive Navigation**: Tabbed interface for easy access to features

## 🏗️ Technical Architecture

### Frontend (`/ai-intent-tracker/`)

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Professional component library with icons
- **State Management**: React hooks for real-time state updates
- **Responsive Design**: Mobile-first approach with touch support

### Backend (`/ai_intent_backend/`)

- **Framework**: Flask (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **API**: RESTful API with CORS support
- **AI Engine**: Custom intent prediction algorithms
- **Session Management**: Secure session handling

### AI/ML Engine

- **Algorithm**: Rule-based machine learning with statistical analysis
- **Features**: Time patterns, interaction levels, scroll behavior, device context
- **Prediction Models**: 8 distinct intent categories with confidence scoring
- **Real-Time Processing**: Instant predictions based on user behavior

## 📂 Project Structure

```bash
ai-powered-website/
├── ai_intent_backend/          # Flask backend & AI engine
│   ├── src/
│   │   ├── main.py            # Main Flask application
│   │   ├── models/            # Database models
│   │   └── routes/            # API endpoints
│   ├── database/
│   │   └── app.db            # SQLite database
│   └── requirements.txt       # Python dependencies
├── ai-intent-tracker/          # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utility functions
│   ├── package.json          # Node.js dependencies
│   ├── pnpm-lock.yaml        # pnpm lock file
│   ├── .npmrc               # Package manager security config
│   └── vite.config.js        # Vite configuration
├── .github/                   # GitHub configuration
│   ├── workflows/            # CI/CD workflows
│   ├── dependabot.yml        # Automated dependency updates
│   └── SECURITY.md           # Security policy symlink
├── scripts/                   # Utility scripts
│   └── check-shai-hulud.sh   # Security compromise detection
└── docs/                      # Project documentation
    ├── AI-Powered Website - Project Documentation.md
    ├── AI-Powered Website Architecture Design.md
    ├── User Behavior Tracking Research.md
    ├── SECURITY.md
    ├── SECURITY_QUICK_START.md
    ├── SECURITY_MITIGATION_PLAN.md
    ├── SHAI_HULUD_ASSESSMENT_SUMMARY.md
    ├── SECURITY_WORKFLOW_MAINTENANCE.md
    ├── VALIDATION_REPORT_AND_FEATURE_PLAN.md
    └── TESTING_ISSUE.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- pnpm (recommended) or npm

### Backend Setup

```bash
cd ai_intent_backend
pip install -r requirements.txt
python src/main.py
```

### Frontend Setup

```bash
cd ai-intent-tracker
pnpm install
pnpm dev
```

### Environment Variables

Create appropriate environment files for your setup. The application uses SQLite by default for development.

### Security Check

Run the security compromise detection script to ensure your environment is clean:

```bash
./scripts/check-shai-hulud.sh
```

## 📊 How the AI Works

The AI intent prediction engine analyzes multiple factors:

1. **Time Patterns**: Session duration and timing behavior
2. **Interaction Level**: Click frequency and engagement depth
3. **Content Engagement**: Scroll depth and reading patterns
4. **Device Context**: Mobile vs desktop usage patterns
5. **Referrer Analysis**: Traffic source influence

The system combines these factors using weighted algorithms to predict user intent with confidence scores.

## 🔧 API Endpoints

### Data Collection

- `POST /api/track/event` - Track user events
- `POST /api/track/session` - Session data
- `POST /api/track/page-view` - Page view tracking

### AI Predictions

- `GET /api/predict/intent` - Get intent prediction
- `POST /api/predict/analyze` - Analyze user behavior
- `GET /api/predict/confidence` - Get prediction confidence

### Privacy Compliance

- `POST /api/privacy/consent` - Manage user consent
- `GET /api/privacy/data` - User data access
- `DELETE /api/privacy/data` - Data deletion requests

## 🛡️ Privacy & Security

- **GDPR Compliant**: Full compliance with EU privacy regulations
- **Consent-Based**: Users control their tracking preferences
- **Data Minimization**: Only necessary data is collected
- **Right to Deletion**: Users can delete their data at any time
- **Transparent Processing**: Clear information about data usage
- **Secure Storage**: All data is securely stored and processed
- **Supply Chain Protection**: Automated scanning for malware and vulnerabilities
- **Install Script Blocking**: Prevents malicious preinstall/postinstall scripts

## 📈 Performance Metrics

### Technical Targets

- Prediction accuracy: >85%
- Response time: <200ms for predictions
- System uptime: >99.9%
- Real-time data processing

### Business Impact

- User engagement improvement
- Conversion rate optimization
- Privacy compliance score
- User satisfaction ratings

## 🔮 Future Enhancements

Potential improvements include:

- Machine learning model training with real user data
- A/B testing capabilities for different prediction algorithms
- Integration with external analytics platforms
- Advanced visualization and reporting features
- Multi-language support for international compliance

## 📚 Documentation

### Project Documentation

- [Project Documentation](docs/AI-Powered%20Website%20-%20Project%20Documentation.md)
- [Architecture Design](docs/AI-Powered%20Website%20Architecture%20Design.md)
- [User Behavior Research](docs/User%20Behavior%20Tracking%20Research.md)

### Security Documentation

- [Security Policy](docs/SECURITY.md) - Vulnerability disclosure and reporting
- [Security Quick Start](docs/SECURITY_QUICK_START.md) - Immediate security actions
- [Security Mitigation Plan](docs/SECURITY_MITIGATION_PLAN.md) - Comprehensive security guide
- [Shai-Hulud Assessment](docs/SHAI_HULUD_ASSESSMENT_SUMMARY.md) - Supply chain security assessment
- [Security Workflow Maintenance](docs/SECURITY_WORKFLOW_MAINTENANCE.md) - How to maintain automated security checks
- [Validation Report and Feature Plan](docs/VALIDATION_REPORT_AND_FEATURE_PLAN.md) - Frontend validation and features
- [Testing Issue](docs/TESTING_ISSUE.md) - Testing documentation

## 🏆 Project Success

This AI-powered website successfully demonstrates:

- ✅ Advanced user behavior tracking
- ✅ Real-time AI intent prediction
- ✅ Professional analytics dashboard
- ✅ Full GDPR compliance
- ✅ Beautiful, responsive design
- ✅ Production-ready deployment
- ✅ Comprehensive security protections
- ✅ Automated vulnerability scanning
- ✅ Supply chain attack mitigation

## 📄 License

This project is available for demonstration and educational purposes.

## 🤝 Contributing

This is a demonstration project. For questions or suggestions, please refer to the documentation.

---
