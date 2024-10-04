'use client';

import React, { useState, useEffect } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WORKER_URL = 'https://date-night-planner.samrhea.workers.dev';

const DateNightPlanner = () => {
  const [preferences, setPreferences] = useState({
    eat: [],
    location: [],
    watch: [],
    genre: [],
    physical_connection_intimacy: []
  });
  const [uniqueId, setUniqueId] = useState('');
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [datePlan, setDatePlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uniqueUrl, setUniqueUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setUniqueId(id);
    }
  }, []);

  useEffect(() => {
    if (preferences.watch.includes('No Screens')) {
      setPreferences(prev => ({ ...prev, genre: [] }));
    }
  }, [preferences.watch]);

  useEffect(() => {
    if (preferences.eat.includes('Cook Together') || preferences.eat.includes('Take Out')) {
      setPreferences(prev => ({ ...prev, go: ['Home'] }));
    }
  }, [preferences.eat]);

  const handleMultiSelect = (category, item) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].includes(item)
        ? prev[category].filter(i => i !== item)
        : [...prev[category], item]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!uniqueId) {
        // First submission
        const response = await fetch(`${WORKER_URL}/submit-preferences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences })
        });
        if (!response.ok) throw new Error('Failed to submit preferences');
        const { id } = await response.json();
        setUniqueId(id);
        const newUniqueUrl = `${window.location.origin}?id=${id}`;
        setUniqueUrl(newUniqueUrl);
      } else {
        // Partner submission
        const response = await fetch(`${WORKER_URL}/generate-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: uniqueId, partnerPreferences: preferences })
        });
        if (!response.ok) throw new Error('Failed to generate plan');
        const { plan } = await response.json();
        setDatePlan(plan);
        setPartnerSubmitted(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uniqueUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    });
  };

  const Option = ({ category, item, emoji, disabled = false }) => (
    <button
      onClick={() => handleMultiSelect(category, item)}
      className={`p-2 m-1 rounded-full text-sm ${
        preferences[category].includes(item)
          ? 'bg-indigo-500 text-white'
          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
      } hover:bg-indigo-400 hover:text-white transition-colors duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled}
    >
      {emoji} {item}
    </button>
  );

  const Section = ({ title, category, options, subgroup, subgroupOptions }) => {
    const isNoScreens = category === 'watch' && preferences.watch.includes('No Screens');
    const isEatInOrTakeOut = category === 'go' && (preferences.eat.includes('Cook Together') || preferences.eat.includes('Take Out'));

    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{title}</h2>
        <div className="flex flex-wrap">
          {options.map(([item, emoji]) => (
            <Option key={item} category={category} item={item} emoji={emoji} disabled={isEatInOrTakeOut && category === 'go' && item !== 'Home'} />
          ))}
        </div>
        {subgroup && (
          <div className={`mt-2 ml-4 ${isNoScreens ? 'opacity-50' : ''}`}>
            <h3 className="text-md font-medium mb-1 text-gray-700 dark:text-gray-300">{subgroup}</h3>
            <div className="flex flex-wrap">
              {subgroupOptions.map(([item, emoji]) => (
                <Option 
                  key={item} 
                  category={subgroup.toLowerCase()} 
                  item={item} 
                  emoji={emoji} 
                  disabled={isNoScreens}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Footer = () => (
    <footer className="text-center text-gray-400 dark:text-gray-500 text-sm mt-4 pb-4">
      <p>
        <a href="https://blog.samrhea.com/category/walkthrough/" className="hover:underline">Built with love on Cloudflare Workers</a> by <a href="https://blog.samrhea.com/pages/about/" className="hover:underline">Sam Rhea</a>.
      </p>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 p-8 flex flex-col">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-4">
        {partnerSubmitted ? (
          <>
            <h1 className="text-3xl font-bold text-center mb-4 text-indigo-600 dark:text-indigo-400">Your Date Night Plan</h1>
            <ReactMarkdown className="prose dark:prose-invert max-w-none">
              {datePlan}
            </ReactMarkdown>
          </>
        ) : uniqueUrl ? (
          <>
            <h1 className="text-3xl font-bold text-center mb-4 text-indigo-600 dark:text-indigo-400">Share with Your Partner</h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Share this link with your partner to plan your date night together:
            </p>
            <div className="flex items-center justify-center mb-6">
              <input
                type="text"
                value={uniqueUrl}
                readOnly
                className="flex-grow p-2 border rounded-l-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 bg-indigo-500 text-white rounded-r-md hover:bg-indigo-600 transition-colors duration-200 flex items-center"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400">
              We'll generate a plan for the two of you once they submit their plans.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-center mb-2 text-indigo-600 dark:text-indigo-400">
              Let's Plan Date Night
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Select your preferences, click submit, and we'll generate a unique link for your partner to add theirs.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Section
                title="🍽️ Let's Eat"
                category="eat"
                options={[
                  ['Cook Together', '🥘'],
                  ['Take Out', '🥡'],
                  ['Eat Out', '🍽️']
                ]}
              />
              
              <Section
                title="🚶 Let's Go"
                category="location"
                options={[
                  ['Dancing', '💃'],
                  ['Strolling', '🚶‍♀️'],
                  ['Culture-ing', '🏛️'],
                  ['Home', '🏠']
                ]}
              />
              
              <Section
                title="🎬 Let's Watch"
                category="watch"
                options={[
                  ['No Screens', '🚫'],
                  ['Binge Series', '📺'],
                  ['Movie Night', '🍿']
                ]}
                subgroup="Genre"
                subgroupOptions={[
                  ['RomCom', '💑'],
                  ['Action', '💥'],
                  ['SitCom', '😂'],
                  ['Drama', '🎭']
                ]}
              />
              
              <Section
                title="❤️ Let's Get Physical?"
                category="physical_connection_intimacy"
                options={[
                  ['Pass', '🙅'],
                  ['Snuggle', '🤗'],
                  ['Make Out', '💏'],
                  ['Hot and Heavy', '🔥']
                ]}
              />

              {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}

              <button
                type="submit"
                className="w-full bg-indigo-500 text-white p-3 rounded-lg hover:bg-indigo-600 transition-colors duration-200 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin mr-2">🔄</span>
                ) : (
                  <Send className="mr-2" size={20} />
                )}
                {isLoading ? 'Processing...' : 'Submit Preferences'}
              </button>
            </form>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default DateNightPlanner;