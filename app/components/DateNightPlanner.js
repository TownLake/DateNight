'use client';

import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WORKER_URL = 'https://date-night-planner.samrhea.workers.dev';

const DateNightPlanner = () => {
  const [preferences, setPreferences] = useState({
    eat: [],
    cuisine: '',
    go: [],
    connect: [],
    more: '',
    watch: [],
    genre: []
  });
  const [uniqueId, setUniqueId] = useState('');
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [datePlan, setDatePlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleMultiSelect = (category, item) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].includes(item)
        ? prev[category].filter(i => i !== item)
        : [...prev[category], item]
    }));
  };

  const handleSingleInput = (category, value) => {
    setPreferences(prev => ({ ...prev, [category]: value }));
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
        const uniqueUrl = `${window.location.origin}?id=${id}`;
        alert(`Share this URL with your partner: ${uniqueUrl}`);
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

  const Option = ({ category, item, emoji, disabled = false }) => (
    <button
      onClick={() => handleMultiSelect(category, item)}
      className={`p-2 m-1 rounded-full text-sm ${
        preferences[category].includes(item)
          ? 'bg-indigo-500 text-white'
          : 'bg-gray-200 text-gray-700'
      } hover:bg-indigo-400 transition-colors duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled}
    >
      {emoji} {item}
    </button>
  );

  const Section = ({ title, category, options, subgroup, subgroupPlaceholder, subgroupOptions }) => {
    const isNoScreens = category === 'watch' && preferences.watch.includes('No Screens');

    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <div className="flex flex-wrap">
          {options.map(([item, emoji]) => (
            <Option key={item} category={category} item={item} emoji={emoji} />
          ))}
        </div>
        {subgroup && (
          <div className={`mt-2 ml-4 ${isNoScreens ? 'opacity-50' : ''}`}>
            <h3 className="text-md font-medium mb-1">{subgroup}</h3>
            {subgroupOptions ? (
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
            ) : (
              <input
                type="text"
                value={preferences[subgroup.toLowerCase()]}
                onChange={(e) => handleSingleInput(subgroup.toLowerCase(), e.target.value)}
                placeholder={subgroupPlaceholder}
                className="w-full p-2 border rounded"
                disabled={isNoScreens}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  if (partnerSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-4 text-indigo-600">Your Date Night Plan</h1>
          <ReactMarkdown className="prose max-w-none">
            {datePlan}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-indigo-600">
          {uniqueId ? "Partner's Date Night Preferences" : "Let's Plan Date Night"}
        </h1>
        <p className="text-center text-gray-600 mb-6">
          {uniqueId 
            ? "Your partner has already submitted their preferences. Now it's your turn!"
            : "Select your preferences, your partner can select theirs without seeing yours, and then our AI will create a date night itinerary."}
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
            subgroup="Cuisine"
            subgroupPlaceholder="Enter cuisine..."
          />
          
          <Section
            title="🚶 Let's Go"
            category="go"
            options={[
              ['Dancing', '💃'],
              ['Strolling', '🚶‍♀️'],
              ['Culture-ing', '🏛️'],
              ['Home', '🏠']
            ]}
          />
          
          <Section
            title="❤️ Let's Connect"
            category="connect"
            options={[
              ['Hold Hands', '🤝'],
              ['Snuggle', '🤗'],
              ['Make Out', '💏'],
              ['Do It', '🔥']
            ]}
            subgroup="More..."
            subgroupPlaceholder="Any other ideas?"
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

          {error && <p className="text-red-500 text-center">{error}</p>}

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
      </div>
    </div>
  );
};

export default DateNightPlanner;