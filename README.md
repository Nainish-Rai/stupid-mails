# Stupid Mails

> An AI-powered email management tool to reduce inbox anxiety and boost productivity.

Stupid Mails helps overwhelmed professionals manage their email overload by automatically classifying and prioritizing messages. By integrating with Gmail and leveraging AI, it identifies important emails and presents them in a focused dashboard, reducing decision fatigue and letting you concentrate on what matters most.

![Project Status: In Development](https://img.shields.io/badge/Status-In%20Development-blue)

## 🌟 Features

- **Gmail Integration** - Securely connect to your Gmail using read-only OAuth
- **AI-Powered Classification** - GPT-powered email categorization based on your preferences
- **Personalized Criteria** - Define what types of emails matter to you using natural language
- **Top 20 Dashboard** - Focus on your most important emails at a glance
- **In-App Labeling** - Visual organization system that helps identify email importance
- **Content Processing** - Intelligent cleaning of email content for better classification

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Gmail API credentials
- OpenAI API key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/stupid-mails.git
cd stupid-mails
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**
   Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/stupid_mails"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Gmail API
GMAIL_CLIENT_ID="your-client-id"
GMAIL_CLIENT_SECRET="your-client-secret"

# OpenAI
OPENAI_API_KEY="your-openai-key"
```

4. **Set up the database**

```bash
npx prisma generate
npx prisma db push
```

5. **Start the development server**

```bash
npm run dev
```

## 🛠️ Tech Stack

- **Frontend**: Next.js with App Router, React, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API routes, PostgreSQL with Prisma ORM
- **APIs**: Gmail API, OpenAI API
- **State Management**: React Query
- **Authentication**: Better-Auth for OAuth flows

## 📁 Project Structure

```
stupid-mails/
├── app/               # Next.js app directory
├── components/        # Reusable UI components
├── lib/               # Utility functions and shared code
├── prisma/            # Database schema and migrations
├── public/            # Static assets
├── services/          # API and external service integrations
├── styles/            # Global styles
└── memory-bank/       # Documentation and project context
```

## 🧪 Development

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- Feature branches: `feature/[feature-name]`
- Bug fixes: `fix/[bug-description]`

### Commit Convention

```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- [file-name]
```

## 📝 Project Status

- ✅ Project initialization and planning
- ✅ Core infrastructure setup
- 🟡 Gmail API integration (read-only)
- 🟡 Email processing pipeline
- 🟡 AI classification system
- ⬜ Top 20 emails display
- ⬜ User preference management
- ⬜ Dashboard implementation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Project Link: [https://github.com/yourusername/stupid-mails](https://github.com/yourusername/stupid-mails)
