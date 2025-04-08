
import React from 'react';
import { Button } from '@/components/ui/button';
import RankCentralLogo from '@/components/RankCentralLogo';
import { useNavigate } from 'react-router-dom';
import { FileText, Settings, BarChart3 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logo */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <RankCentralLogo size={40} />
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => navigate('/documents')}>
            Login
          </Button>
          <Button onClick={() => navigate('/documents')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 bg-gradient-to-b from-white to-brand-light text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-brand-dark tracking-tight">
            Document Ranking Made <span className="text-brand-primary">Simple</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Compare and rank documents based on customizable criteria or prompts with Artificial Intelligence
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-brand-primary hover:bg-brand-dark text-white px-8 py-6 text-lg"
              onClick={() => navigate('/documents')}
            >
              Start Ranking Now
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-brand-primary text-brand-primary hover:bg-brand-light px-8 py-6 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How rankCentral Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
                <FileText className="text-brand-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Upload Documents</h3>
              <p className="text-gray-600">
                Input your documents directly or upload files in various formats for comparison
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
                <Settings className="text-brand-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Define Criteria</h3>
              <p className="text-gray-600">
                Set custom ranking criteria with specific weightages or use our default rubrics
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="text-brand-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">View Results</h3>
              <p className="text-gray-600">
                Get comprehensive results with detailed pairwise comparisons powered by AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <RankCentralLogo className="text-white" />
            <p className="text-gray-400 mt-2">© 2023 rankCentral. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <div>
              <h4 className="font-semibold mb-2">Product</h4>
              <ul className="text-gray-400 space-y-1">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Company</h4>
              <ul className="text-gray-400 space-y-1">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
