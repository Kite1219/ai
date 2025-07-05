# Undetectable AI Humanizer

A modern, minimalistic web application that transforms AI-generated text into human-like content using the Undetectable.ai API v2. Inspired by the design principles of Apple.com and OpenAI.com.

## 🚀 Features

✅ **Complete API Integration**: All Undetectable.ai API v2 features implemented  
✅ **Text Humanization**: Transform AI-generated content into natural, human-like text  
✅ **Real-time Streaming**: WebSocket-based streaming for live humanization results  
✅ **Rehumanize Documents**: Re-process existing documents for different results  
✅ **Document Management**: Access both local history and server-side documents  
✅ **Handover to Web UI**: Seamlessly transfer content to the Undetectable.ai web interface  
✅ **User Credits Display**: Real-time credits monitoring with refresh capability  
✅ **Customizable Parameters**: Full control over readability, purpose, strength, and model  
✅ **Dark/Light Mode**: System-aware theme switching with persistent settings  
✅ **History Management**: Local storage with improved error handling  
✅ **Clipboard Integration**: One-click copy-to-clipboard functionality  
✅ **Responsive Design**: Mobile-first design that works on all devices  
✅ **Error Handling**: Comprehensive error handling with user-friendly messages  
✅ **Toast Notifications**: Real-time feedback for all user actions  
✅ **Modern Animations**: Smooth Framer Motion transitions and effects  

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 14 with App Router |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | Custom React components |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Fonts** | Inter (Google Fonts) |
| **State Management** | React Hooks |
| **Storage** | LocalStorage API |
| **HTTP Client** | Fetch API |
| **WebSocket** | Native WebSocket API |
| **Development** | ESLint, Prettier |
| **Deployment** | Vercel-ready |

## 🔌 API Integration

This application implements **all** Undetectable.ai API v2 features:

### Core Features
- **Submit Document**: Submit text for humanization
- **Retrieve Document**: Get processed results
- **Rehumanize Document**: Re-process for different results
- **List Documents**: Access server-side document history
- **Check User Credits**: Monitor available credits

### Advanced Features
- **Hand-over Document**: Transfer to web UI for further editing
- **Streaming Support**: Real-time WebSocket-based processing
- **Polling System**: Automatic result checking with optimized intervals
- **Error Recovery**: Robust error handling and retry mechanisms

## ⚙️ Configuration Options

### Readability Levels
- **High School**: Simple, accessible language
- **University**: Academic writing style
- **Doctorate**: Advanced academic language
- **Journalist**: News and media style
- **Marketing**: Promotional and engaging tone

### Content Purpose
- **General Writing**: Multi-purpose content
- **Essay**: Academic essays and papers
- **Article**: Blog posts and articles
- **Marketing Material**: Promotional content
- **Story**: Creative and narrative content
- **Cover Letter**: Professional correspondence
- **Report**: Business and technical reports
- **Business Material**: Corporate communications
- **Legal Material**: Legal documents and contracts

### Humanization Strength
- **Quality**: Balanced approach with quality focus
- **Balanced**: Default setting for most use cases
- **More Human**: Maximum humanization for AI detection bypass

### AI Models
- **v11 (Latest)**: Most advanced model with latest improvements
- **v2**: Previous stable version

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone or download the project**
   ```bash
   # If you have the source code
   cd Project1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 💡 Usage Guide

### Basic Humanization
1. **Enter Text**: Paste your AI-generated text (minimum 50 characters)
2. **Configure Settings**: Choose readability, purpose, strength, and model
3. **Humanize**: Click "Humanize Text" to process
4. **Review Results**: View the humanized output
5. **Copy Results**: Use the copy button to copy the result

### Advanced Features

#### Streaming Mode
- Toggle "Streaming ON" for real-time results
- Watch text appear as it's being processed
- Stop streaming at any time to get partial results

#### Rehumanize
- Click "Rehumanize" button after getting results
- Generate alternative versions of the same content
- Useful for getting different writing styles

#### Document Management
- **Local History**: Automatically saved in browser storage
- **Server Documents**: Access your server-side document history
- **Load from History**: Click any history item to reload

#### Handover to Web UI
- Click "Handover to UI" to transfer content
- Opens Undetectable.ai web interface in new tab
- Continue editing with full web features

#### Credits Monitoring
- Real-time credits display in header
- Refresh button to update credits
- Detailed breakdown of base and boost credits

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with theme and metadata
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles and Tailwind
├── components/
│   ├── ui/
│   │   ├── button.tsx      # Reusable Button component
│   │   ├── textarea.tsx    # Reusable Textarea component
│   │   └── select.tsx      # Reusable Select component
│   └── theme-provider.tsx  # Dark/light theme management
├── lib/
│   ├── api.ts              # Complete API client with all features
│   └── utils.ts            # Utility functions and helpers
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel deployment configuration
```

## 🎨 Design System

### Color Palette
- **Light Mode**: White backgrounds, gray text, black accents
- **Dark Mode**: Black backgrounds, white text, gray accents
- **Accents**: Blue for primary actions, red for errors, green for success

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Responsive**: Scales appropriately on all devices

### Components
- **Buttons**: Multiple variants (default, outline, ghost, destructive)
- **Inputs**: Consistent styling with focus states
- **Cards**: Subtle shadows and borders
- **Animations**: Smooth transitions using Framer Motion

## 🔧 Configuration

### Environment Variables
For production deployment, consider using environment variables:

```env
# .env.local
NEXT_PUBLIC_UNDETECTABLE_API_KEY=your_api_key_here
NEXT_PUBLIC_API_BASE_URL=https://humanize.undetectable.ai
```

### API Configuration
The API key is currently hardcoded for demo purposes. For production:

1. Move API key to environment variables
2. Add API key validation
3. Implement rate limiting
4. Add request logging

## 📱 Browser Support

- **Chrome**: 88+
- **Firefox**: 78+
- **Safari**: 14+
- **Edge**: 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm run start
```

## 🔒 Security Features

- Content Security Policy headers
- XSS protection
- CSRF prevention
- Secure cookie handling
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **API Errors**: Check API key and network connection
2. **Build Failures**: Ensure all dependencies are installed
3. **Theme Issues**: Clear browser cache and localStorage
4. **Streaming Problems**: Check WebSocket support and network firewall

### Error Messages
- **"Text must be at least 50 characters"**: Increase input text length
- **"API request failed"**: Check API key and network connection
- **"Insufficient credits"**: Check your account credits
- **"Processing timed out"**: Try again or use shorter text

## 📝 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Code Style
- ESLint for code quality
- Prettier for formatting
- TypeScript for type safety
- Consistent naming conventions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and formatting
6. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 🔗 Links

- [Undetectable.ai](https://undetectable.ai/)
- [API Documentation](https://humanize.undetectable.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For questions, issues, or feature requests, please contact the development team. 