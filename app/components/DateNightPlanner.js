'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WORKER_URL = 'https://date-night-planner.samrhea.workers.dev';

const initialPreferences = {
  eat: [],
  location: [],
  watch: [],
  genre: [],
  physical_connection_intimacy: []
};

const DateNightPlanner = () => {
  const [preferences, setPreferences] = useState(initialPreferences);
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

  const handleMultiSelect = useCallback((category, item) => {
    setPreferences(prev => {
      if (category === 'physical_connection_intimacy') {
        if (item === 'No Thanks') {
          if (prev[category].includes('No Thanks')) {
            return { ...prev, [category]: [] };
          }
          return { ...prev, [category]: ['No Thanks'] };
        } else {
          return {
            ...prev,
            [category]: prev[category].includes(item)
              ? prev[category].filter(i => i !== item)
              : [...prev[category].filter(i => i !== 'No Thanks'), item]
          };
        }
      }

      return {
        ...prev,
        [category]: prev[category].includes(item)
          ? prev[category].filter(i => i !== item)
          : [...prev[category], item]
      };
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = uniqueId ? `${WORKER_URL}/generate-plan` : `${WORKER_URL}/submit-preferences`;
      const body = uniqueId
        ? JSON.stringify({ id: uniqueId, partnerPreferences: preferences })
        : JSON.stringify({ preferences });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (uniqueId) {
        setDatePlan(data.plan);
        setPartnerSubmitted(true);
      } else {
        setUniqueId(data.id);
        const newUniqueUrl = `${window.location.origin}?id=${data.id}`;
        setUniqueUrl(newUniqueUrl);
      }
    } catch (err) {
      setError(`Failed to ${uniqueId ? 'generate plan' : 'submit preferences'}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(uniqueUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => setError(`Failed to copy: ${err.message}`));
  }, [uniqueUrl]);

  const Option = React.memo(({ category, item, emoji, disabled = false }) => (
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
  ));

  const Section = React.memo(({ title, category, options, subgroup, subgroupOptions }) => {
    const isNoScreens = category === 'watch' && preferences.watch.includes('No Screens');
    const isNoThanksSelected = category === 'physical_connection_intimacy' && preferences.physical_connection_intimacy.includes('No Thanks');

    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{title}</h2>
        <div className="flex flex-wrap">
          {options.map(([item, emoji]) => (
            <Option 
              key={item} 
              category={category} 
              item={item} 
              emoji={emoji} 
              disabled={isNoThanksSelected && category === 'physical_connection_intimacy' && item !== 'No Thanks'}
            />
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
  });

  const Footer = React.memo(() => (
    <footer className="text-center text-gray-400 dark:text-gray-500 text-sm mt-4 pb-4">
      <p>
        <a href="https://github.com/TownLake/DateNight" className="hover:underline">Built with love on Cloudflare Workers</a> by <a href="https://github.com/TownLake/DateNight" className="hover:underline">Sam Rhea</a>. <a href="https://github.com/TownLake/DateNight/issues" className="hover:underline"> Submit feedback.</a>
      </p>
    </footer>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 p-4 sm:p-8 flex flex-col">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-8 mb-4">
        {partnerSubmitted ? (
          <>
            <h1 className="text-3xl font-bold text-center mb-4 text-indigo-600 dark:text-indigo-400">Your Date Night Plan</h1>
            <ReactMarkdown className="prose dark:prose-invert max-w-none">
              {datePlan}
            </ReactMarkdown>
          </>
        ) : uniqueUrl ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-indigo-600 dark:text-indigo-400">Share with Your Partner</h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Share this link with your partner:
            </p>
            <div className="flex items-center justify-center mb-6">
              <input
                type="text"
                value={uniqueUrl}
                readOnly
                className="w-32 sm:w-48 p-2 border rounded-l-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 truncate"
              />
              <button
                onClick={copyToClipboard}
                className="h-[42px] p-2 bg-indigo-500 text-white rounded-r-md hover:bg-indigo-600 transition-colors duration-200 flex items-center justify-center"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                <span className="ml-2 hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400">
              We'll generate a plan once they submit their preferences.
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
                  ['No Thanks', '🙅'],
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
                {isLoading ? 'Planning your date night...' : 'Submit Preferences'}
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
