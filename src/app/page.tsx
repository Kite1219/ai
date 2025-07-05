'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Moon, 
  Sun, 
  Copy, 
  History, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  ArrowRight,
  Loader2,
  Settings,
  BookOpen,
  Target,
  Zap,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Pause,
  Play,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useTheme } from '@/components/theme-provider';
import { 
  apiClient, 
  pollForDocument, 
  pollForDetection,
  validateTextLength, 
  formatError,
  HumanizeRequest,
  DocumentResponse,
  UserCredits,
  StreamingClient,
  generateHandoverUrl,
  DetectorRequest,
  DetectorResponse
} from '@/lib/api';
import { 
  historyManager, 
  clipboard, 
  textUtils, 
  HistoryItem,
  generateUserId
} from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const streamingRef = useRef<StreamingClient | null>(null);
  const [userId] = useState(() => generateUserId());
  
  // Form state
  const [inputText, setInputText] = useState('');
  const [readability, setReadability] = useState<HumanizeRequest['readability']>('High School');
  const [purpose, setPurpose] = useState<HumanizeRequest['purpose']>('General Writing');
  const [strength, setStrength] = useState<HumanizeRequest['strength']>('Balanced');
  const [model, setModel] = useState<HumanizeRequest['model']>('v11');
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>('');
  
  // Credits and streaming
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [useStreaming, setUseStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Detector state
  const [detectorResult, setDetectorResult] = useState<DetectorResponse | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showDetector, setShowDetector] = useState(false);
  
  // Progress and settings state
  const [progress, setProgress] = useState(0);
  const [showHumanizeSettings, setShowHumanizeSettings] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  
  // Load data on mount
  useEffect(() => {
    setMounted(true);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Load local history
    setHistory(historyManager.get());
    
    // Load user credits
    try {
      const userCredits = await apiClient.getUserCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  // Options for dropdowns
  const readabilityOptions = [
    { value: 'High School', label: 'High School' },
    { value: 'University', label: 'University' },
    { value: 'Doctorate', label: 'Doctorate' },
    { value: 'Journalist', label: 'Journalist' },
    { value: 'Marketing', label: 'Marketing' },
  ];

  const purposeOptions = [
    { value: 'General Writing', label: 'General Writing' },
    { value: 'Essay', label: 'Essay' },
    { value: 'Article', label: 'Article' },
    { value: 'Marketing Material', label: 'Marketing Material' },
    { value: 'Story', label: 'Story' },
    { value: 'Cover Letter', label: 'Cover Letter' },
    { value: 'Report', label: 'Report' },
    { value: 'Business Material', label: 'Business Material' },
    { value: 'Legal Material', label: 'Legal Material' },
  ];

  const strengthOptions = [
    { value: 'Quality', label: 'Quality' },
    { value: 'Balanced', label: 'Balanced' },
    { value: 'More Human', label: 'More Human' },
  ];

  const modelOptions = [
    { value: 'v11', label: 'v11 (Latest)' },
    { value: 'v2', label: 'v2' },
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleSubmit = async () => {
    if (!validateTextLength(inputText)) {
      setError('Text must be at least 50 characters long');
      return;
    }

    if (useStreaming) {
      await handleStreamingSubmit();
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult('');
    setProgress(0);

    try {
      const request: HumanizeRequest = {
        content: inputText,
        readability,
        purpose,
        strength,
        model,
      };

      setProgress(20);
      const response = await apiClient.submitDocument(request);
      setCurrentDocId(response.id);
      
      setProgress(40);
      // Start polling with progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 80));
      }, 1000);
      
      const document = await pollForDocument(response.id);
      
      clearInterval(progressInterval);
      setProgress(90);
      
      setResult(document.output);
      
      // Add to history
      const newHistory = historyManager.add(
        historyManager.fromDocumentResponse(document)
      );
      setHistory(newHistory);
      
      // Refresh credits
      const userCredits = await apiClient.getUserCredits();
      setCredits(userCredits);
      
      setProgress(100);
      showToast('Text humanized successfully!', 'success');
    } catch (err) {
      const errorMessage = formatError(err);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleStreamingSubmit = async () => {
    if (!streamingRef.current) {
      streamingRef.current = new StreamingClient(userId);
    }

    setIsStreaming(true);
    setError('');
    setStreamingText('');
    setResult('');

    const request: HumanizeRequest = {
      content: inputText,
      readability,
      purpose,
      strength,
      model,
    };

    await streamingRef.current.startStreaming(
      request,
      (chunk) => {
        setStreamingText(prev => prev + chunk);
      },
      (fullText) => {
        setResult(fullText);
        setIsStreaming(false);
        showToast('Streaming completed!', 'success');
      },
      (error) => {
        setError(error);
        setIsStreaming(false);
        showToast(error, 'error');
      }
    );
  };

  const handleStopStreaming = () => {
    if (streamingRef.current) {
      streamingRef.current.stopStreaming();
      setIsStreaming(false);
      if (streamingText) {
        setResult(streamingText);
      }
      showToast('Streaming stopped', 'info');
    }
  };

  const handleRehumanize = async () => {
    if (!currentDocId) {
      showToast('No document to rehumanize', 'warning');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProgress(0);

    try {
      setProgress(20);
      const response = await apiClient.rehumanizeDocument(currentDocId);
      
      setProgress(40);
      // Start polling with progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 80));
      }, 1000);
      
      const document = await pollForDocument(response.id);
      
      clearInterval(progressInterval);
      setProgress(90);
      
      setResult(document.output);
      setCurrentDocId(response.id);
      
      // Add to history
      const newHistory = historyManager.add(
        historyManager.fromDocumentResponse(document)
      );
      setHistory(newHistory);
      
      // Refresh credits
      const userCredits = await apiClient.getUserCredits();
      setCredits(userCredits);
      
      setProgress(100);
      showToast('Document rehumanized successfully!', 'success');
    } catch (err) {
      const errorMessage = formatError(err);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleHandover = async () => {
    if (!inputText.trim()) {
      showToast('Please enter some text first', 'warning');
      return;
    }

    try {
      const response = await apiClient.handoverDocument(inputText);
      const handoverUrl = generateHandoverUrl(response.id);
      
      // Open in new tab
      window.open(handoverUrl, '_blank');
      showToast('Handover created! Opening in new tab...', 'success');
    } catch (err) {
      const errorMessage = formatError(err);
      showToast(errorMessage, 'error');
    }
  };



  const handleRefreshCredits = async () => {
    try {
      const userCredits = await apiClient.getUserCredits();
      setCredits(userCredits);
      showToast('Credits refreshed', 'success');
    } catch (err) {
      const errorMessage = formatError(err);
      showToast(errorMessage, 'error');
    }
  };

  const handleCopy = async (text: string) => {
    const success = await clipboard.copy(text);
    if (success) {
      showToast('Copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleClearHistory = () => {
    historyManager.clear();
    setHistory([]);
    showToast('History cleared', 'info');
  };

  const handleDetection = async () => {
    if (!validateTextLength(inputText)) {
      setError('Text must be at least 200 characters long for accurate AI detection');
      return;
    }

    setIsDetecting(true);
    setError('');
    setDetectorResult(null);

    try {
      const request: DetectorRequest = {
        text: inputText,
        model: 'xlm_ud_detector',
      };

      const response = await apiClient.submitDetection(request);
      const detection = await pollForDetection(response.id);
      
      setDetectorResult(detection);
      setShowDetector(true);
      showToast('AI detection completed!', 'success');
    } catch (err) {
      const errorMessage = formatError(err);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setInputText(item.input);
    setResult(item.output);
    setReadability(item.readability as HumanizeRequest['readability']);
    setPurpose(item.purpose as HumanizeRequest['purpose']);
    setShowHistory(false);
    showToast('Loaded from history', 'info');
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'humanizer_history.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('History exported', 'success');
  };

  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedHistory = JSON.parse(e.target?.result as string);
          const updatedHistory = [...history, ...importedHistory];
          setHistory(updatedHistory);
          // Manually update storage since historyManager doesn't have setHistory
          localStorage.setItem('humanizer-history', JSON.stringify(updatedHistory));
          showToast('History imported successfully', 'success');
        } catch (error) {
          showToast('Failed to import history - invalid format', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const newHistory = historyManager.remove(id);
    setHistory(newHistory);
    showToast('History item deleted', 'info');
  };

  const filteredHistory = history.filter(item => 
    item.input.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    item.purpose.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    item.readability.toLowerCase().includes(historySearchTerm.toLowerCase())
  );



  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-gray-900 dark:text-white" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hiuman
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Credits Display */}
              {credits && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {textUtils.formatCredits(credits.credits)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshCredits}
                    className="p-1 h-6 w-6"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="hidden sm:flex"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings')}
                className="hidden sm:flex"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                Humanize Your AI Text
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Transform AI-generated content into natural, human-like text that bypasses detection algorithms.
              </p>
            </motion.div>

            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your text (minimum 50 characters)
                </label>
                <Textarea
                  id="input-text"
                  placeholder="Paste your AI-generated text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                  <span>{textUtils.charCount(inputText)} characters</span>
                  <span>{textUtils.wordCount(inputText)} words</span>
                </div>
              </div>

              {/* Streaming Toggle */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseStreaming(!useStreaming)}
                  className={useStreaming ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                >
                  {useStreaming ? (
                    <Wifi className="h-4 w-4 mr-2" />
                  ) : (
                    <WifiOff className="h-4 w-4 mr-2" />
                  )}
                  {useStreaming ? 'Streaming ON' : 'Streaming OFF'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHandover}
                  disabled={!inputText.trim()}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Handover to UI
                </Button>
              </div>



              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isProcessing || isStreaming}
                  loading={isProcessing}
                  size="lg"
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Humanize Text
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                
                {isStreaming && (
                  <Button
                    onClick={handleStopStreaming}
                    variant="destructive"
                    size="lg"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Streaming
                  </Button>
                )}
                
                {result && currentDocId && (
                  <Button
                    onClick={handleRehumanize}
                    variant="outline"
                    size="lg"
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rehumanize
                  </Button>
                )}
                
                <Button
                  onClick={handleDetection}
                  variant="outline"
                  size="lg"
                  disabled={!inputText.trim() || isDetecting || isProcessing}
                  loading={isDetecting}
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      AI Detector
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowHumanizeSettings(true)}
                  size="lg"
                  className="sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Humanize Settings
                </Button>
              </div>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700 dark:text-red-300">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Bar */}
            <AnimatePresence>
              {isProcessing && progress > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Processing...
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      className="bg-blue-500 h-2 rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Streaming Display */}
            <AnimatePresence>
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Wifi className="h-5 w-5 mr-2 text-blue-500" />
                      Streaming Result
                    </h3>
                    <div className="animate-pulse text-blue-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-medium">
                      {streamingText}
                      <span className="animate-pulse">|</span>
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result Section */}
            <AnimatePresence>
              {result && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Humanized Result
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(result)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-medium">
                      {result}
                    </pre>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{textUtils.charCount(result)} characters</span>
                    <span>{textUtils.wordCount(result)} words</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Humanizing Settings Modal */}
          <AnimatePresence>
            {showHumanizeSettings && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setShowHumanizeSettings(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 space-y-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Humanizing Settings
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHumanizeSettings(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                                         <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Readability Level
                       </label>
                       <Select
                         value={readability}
                         onChange={(e) => setReadability(e.target.value as HumanizeRequest['readability'])}
                         options={readabilityOptions}
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Content Purpose
                       </label>
                       <Select
                         value={purpose}
                         onChange={(e) => setPurpose(e.target.value as HumanizeRequest['purpose'])}
                         options={purposeOptions}
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Humanization Strength
                       </label>
                       <Select
                         value={strength}
                         onChange={(e) => setStrength(e.target.value as HumanizeRequest['strength'])}
                         options={strengthOptions}
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         AI Model
                       </label>
                       <Select
                         value={model}
                         onChange={(e) => setModel(e.target.value as HumanizeRequest['model'])}
                         options={modelOptions}
                       />
                     </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setUseStreaming(!useStreaming)}
                        className={useStreaming ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      >
                        {useStreaming ? 'Streaming ON' : 'Streaming OFF'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowHumanizeSettings(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setShowHumanizeSettings(false)}
                    >
                      Save Settings
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credits Panel */}
            {credits && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Credits
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshCredits}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Base Credits:</span>
                    <span className="text-sm font-medium">{textUtils.formatCredits(credits.baseCredits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Boost Credits:</span>
                    <span className="text-sm font-medium">{textUtils.formatCredits(credits.boostCredits)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">{textUtils.formatCredits(credits.credits)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* History Panel */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Local History
                    </h3>
                    <div className="flex items-center space-x-2">
                      {history.length > 0 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExportHistory}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => document.getElementById('history-import')?.click()}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearHistory}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistory(false)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    id="history-import"
                    accept=".json"
                    onChange={handleImportHistory}
                    className="hidden"
                  />
                  
                  {history.length > 0 && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search history..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredHistory.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        {history.length === 0 ? 'No history yet. Start humanizing some text!' : 'No results found. Try a different search term.'}
                      </p>
                    ) : (
                      filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white dark:bg-gray-800 rounded border hover:shadow-md transition-shadow relative group"
                        >
                          <div
                            className="cursor-pointer"
                            onClick={() => handleLoadFromHistory(item)}
                          >
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {textUtils.formatRelativeTime(item.timestamp)}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              {item.purpose} • {item.readability}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {textUtils.truncate(item.input, 100)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistoryItem(item.id);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Detector Results Panel */}
            <AnimatePresence>
              {showDetector && detectorResult && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      AI Detection Results
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetector(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Main Result */}
                    <div className={`p-4 rounded-lg border-2 ${
                      detectorResult.result !== null && detectorResult.result > 60 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                        : detectorResult.result !== null && detectorResult.result > 50
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {detectorResult.result !== null && detectorResult.result > 60 ? (
                            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ) : detectorResult.result !== null && detectorResult.result > 50 ? (
                            <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            Overall Score
                          </span>
                        </div>
                        <span className="text-2xl font-bold">
                          {detectorResult.result !== null ? `${detectorResult.result.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {detectorResult.result !== null && detectorResult.result > 60 
                          ? 'Likely AI-generated content' 
                          : detectorResult.result !== null && detectorResult.result > 50
                          ? 'Possibly AI-generated content'
                          : 'Likely human-written content'
                        }
                      </p>
                    </div>

                    {/* Detailed Results */}
                    {detectorResult.result_details && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Detailed Scores
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600 dark:text-gray-400">GPTZero:</span>
                            <span className="font-medium">{detectorResult.result_details.scoreGptZero}%</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600 dark:text-gray-400">OpenAI:</span>
                            <span className="font-medium">{detectorResult.result_details.scoreOpenAI}%</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600 dark:text-gray-400">Writer:</span>
                            <span className="font-medium">{detectorResult.result_details.scoreWriter}%</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600 dark:text-gray-400">ZeroGPT:</span>
                            <span className="font-medium">{detectorResult.result_details.scoreZeroGPT}%</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600 dark:text-gray-400">Copyleaks:</span>
                            <span className="font-medium">{detectorResult.result_details.scoreCopyLeaks}%</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-600 dark:text-gray-400">Sapling:</span>
                            <span className="font-medium">{detectorResult.result_details.scoreSapling}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Tips for Better Results
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Use at least 50 characters for processing</li>
                <li>• Use 200+ characters for accurate AI detection</li>
                <li>• Choose the appropriate readability level</li>
                <li>• Select the correct purpose for your content</li>
                <li>• Try different strength settings for variety</li>
                <li>• Use v11 model for latest improvements</li>
                <li>• Enable streaming for real-time results</li>
                <li>• Test with AI detector before submitting</li>
                <li>• Use handover to continue in the web UI</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-3 rounded-lg shadow-lg max-w-sm ${
                toast.type === 'success' ? 'bg-green-500 text-white' :
                toast.type === 'error' ? 'bg-red-500 text-white' :
                toast.type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              }`}
            >
              <div className="flex items-center">
                {toast.type === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                {toast.type === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
                {toast.type === 'warning' && <AlertCircle className="h-4 w-4 mr-2" />}
                <span className="text-sm">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
} 