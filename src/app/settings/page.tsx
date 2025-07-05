'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Settings, 
  Key, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { storage } from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setMounted(true);
    // Load saved API key
    const savedApiKey = storage.get('undetectable-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      showToast('Please enter an API key', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Validate API key format (basic check)
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(apiKey)) {
        showToast('Invalid API key format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'error');
        return;
      }

      // Save to localStorage
      storage.set('undetectable-api-key', apiKey);
      showToast('API key saved successfully!', 'success');
      
      // Navigate back after a delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      showToast('Failed to save API key', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <Settings className="h-8 w-8 text-gray-900 dark:text-white" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Settings
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* API Configuration Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Key className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                API Configuration
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Undetectable.ai API Key
                </label>
                <div className="relative">
                  <input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                    className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Get your API key from your{' '}
                  <a
                    href="https://undetectable.ai/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Undetectable.ai dashboard
                  </a>
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveApiKey}
                  disabled={isLoading || !apiKey.trim()}
                  loading={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save API Key
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              How to get your API key
            </h3>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>1. Go to <a href="https://undetectable.ai/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Undetectable.ai dashboard</a></li>
              <li>2. Navigate to the Developer API section</li>
              <li>3. Copy your API key from the top of the page</li>
              <li>4. Paste it in the field above and click "Save API Key"</li>
              <li>5. The key will be securely stored in your browser's local storage</li>
            </ol>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
              Security Notice
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your API key is stored locally in your browser and is never sent to any third-party servers. 
              It's only used to authenticate with Undetectable.ai's official API endpoints.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-3 rounded-lg shadow-lg max-w-sm ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center">
              {toast.type === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
              <span className="text-sm">{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 