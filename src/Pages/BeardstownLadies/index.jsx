import React, { useState, useEffect } from 'react';
import './BeardstownLadies.css';
import { Page } from '../Page';

const BeardstownLadies = () => {
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({ chapter1: true });

  // Load saved progress on mount
  useEffect(() => {
    const saved = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ffa_beardstown_check_')) {
        const itemKey = key.replace('ffa_beardstown_check_', '');
        saved[itemKey] = localStorage.getItem(key) === '1';
      }
    });
    setCheckedItems(saved);
  }, []);

  // Save progress when items change
  const handleCheckChange = (key, checked) => {
    setCheckedItems(prev => ({ ...prev, [key]: checked }));
    localStorage.setItem(`ffa_beardstown_check_${key}`, checked ? '1' : '0');
  };

  // Calculate progress
  const totalItems = 17; // Total checklist items
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  // Toggle all chapters
  const toggleAllChapters = (open) => {
    const chapters = ['chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'chapter7', 'chapter8', 'chapter9', 'chapter10'];
    const newState = {};
    chapters.forEach(chapter => newState[chapter] = open);
    setExpandedChapters(newState);
  };

  // Checklist controls
  const checkAll = (value) => {
    const newChecked = {};
    ['s1a', 's1b', 's1c', 's2a', 's2b', 's2c', 's2d', 's3a', 's3b', 's3c', 's4a', 's4b', 's4c', 's5a', 's6a', 's7a'].forEach(key => {
      newChecked[key] = value;
      localStorage.setItem(`ffa_beardstown_check_${key}`, value ? '1' : '0');
    });
    setCheckedItems(newChecked);
  };

  const resetChecklist = () => {
    Object.keys(checkedItems).forEach(key => {
      localStorage.removeItem(`ffa_beardstown_check_${key}`);
    });
    setCheckedItems({});
  };

  return (
    <Page title="📚 Beardstown Ladies Investment Guide" subtitle="Investment club wisdom from the famous Beardstown Ladies">
      <div className="beardstown-container">
        <div className="beardstown-wrap">
        {/* Table of Contents */}
        <nav className="beardstown-toc beardstown-card">
          <h2>On this page</h2>
          <a href="#overview">Overview</a>
          <a href="#chapters">Chapter-by-Chapter</a>
          <a href="#bylaws">Financial Administration & Philosophy</a>
          <a href="#checklist">Stock-Buying Checklist</a>
          <a href="#portfolio">Model Portfolio</a>
          <a href="#takeaways">Recurring Strategies & Legacy</a>
          <div className="beardstown-kpi">
            <span className="beardstown-dot"></span>
            <span>Autosaves checklist progress</span>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <section id="top" className="beardstown-card">
            <h1>The Beardstown Ladies — Practical Overview & Club Playbook</h1>
            <div className="beardstown-subtitle">
              Clear lessons, modern applications, and a ready-to-use club checklist.
            </div>
            <div className="beardstown-toolbar">
              <div className="beardstown-badge">Updated for modern investors</div>
              <div>
                <button onClick={() => toggleAllChapters(true)}>Open all chapters</button>
                <button onClick={() => toggleAllChapters(false)}>Close all</button>
                <button onClick={() => window.print()}>Print</button>
              </div>
            </div>
          </section>

          {/* Overview */}
          <section id="overview" className="beardstown-card">
            <h2>Overview</h2>
            <p>
              Published in <strong>1994</strong>, the book captured the national imagination because it came from an unlikely source: a group of older women in Beardstown, Illinois, who claimed to have "beaten the stock market" through a disciplined, common-sense approach to investing. Their club—founded in <strong>1983</strong>—was a model of small-town cooperation, thrift, and education. The book became a bestseller, part how-to manual, part social story, showing that ordinary people (especially women) could manage their own money.
            </p>
            <p>
              Later, it emerged that the group's returns were <strong>overstated due to accounting errors</strong>, not fraud. But the underlying philosophy—patient, collective, educational investing—remains solid and influential.
            </p>
          </section>

          {/* Chapters */}
          <section id="chapters" className="beardstown-card">
            <h2>Chapter-by-Chapter Overview</h2>
            <div className="beardstown-grid">
              {/* Chapter 1 */}
              <details open={expandedChapters.chapter1}>
                <summary>Chapter 1 – How We Got Started</summary>
                <div className="beardstown-panel">
                  <h3>Summary</h3>
                  <p>
                    Introduces the Beardstown Ladies Investment Club: a group of 16 women meeting monthly to pool small amounts of money and learn about investing. They emphasize camaraderie, education, and the democratic structure of their club.
                  </p>
                  <h3>Core Investment Lessons</h3>
                  <ul className="beardstown-list">
                    <li><strong>Start small but start.</strong> Regular contributions compound over time.</li>
                    <li><strong>Learn together</strong>—education is the purpose, profit is the by-product.</li>
                    <li><strong>Keep rules simple and transparent.</strong></li>
                  </ul>
                  <h3>Real-World Application</h3>
                  <p>
                    Today, investment clubs can use online platforms like Bivio or NAIC/BetterInvesting, or even Google Sheets, to manage pooled portfolios and track unit values. Fractional investing apps (like Fidelity Spire or Robinhood) let members simulate this approach with ease.
                  </p>
                  <h3>Context & Reflection</h3>
                  <p>
                    This mirrored the 1980s democratization of finance, when discount brokers and mutual funds made stock ownership accessible. The Beardstown Ladies reflected a wave of middle-class empowerment before the dot-com boom.
                  </p>
                </div>
              </details>

              {/* Additional chapters would follow the same pattern */}
              <details open={expandedChapters.chapter2}>
                <summary>Chapter 2 – What We've Learned About the Stock Market</summary>
                <div className="beardstown-panel">
                  <h3>Summary</h3>
                  <p>
                    The authors demystify Wall Street. They argue stocks represent ownership in real businesses, not gambling chips, and that over time, good companies make money for shareholders.
                  </p>
                  <h3>Core Investment Lessons</h3>
                  <ul className="beardstown-list">
                    <li>Think long term; short-term fluctuations don't matter.</li>
                    <li>Invest in what you understand—avoid fads.</li>
                    <li>Reinvest dividends for compounding.</li>
                  </ul>
                  <h3>Real-World Application</h3>
                  <p>
                    A modern investor might interpret this as: buy broad-market ETFs or stocks of companies whose products you use daily, hold them for years, and let automatic dividend reinvestment do the work.
                  </p>
                </div>
              </details>

              {/* Continue with other chapters... */}
            </div>
          </section>

          {/* Stock-Buying Checklist */}
          <section id="checklist" className="beardstown-card">
            <h2>Stock-Buying Checklist</h2>
            <p className="beardstown-small beardstown-muted">
              Inspired by the Beardstown Ladies' due-diligence process; your progress automatically saves in this browser.
            </p>
            
            <div className="beardstown-progress">
              <div 
                className="beardstown-progress-bar" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <div className="beardstown-toolbar">
              <span className="beardstown-small beardstown-muted">
                {progressPercent}% complete
              </span>
              <div>
                <button onClick={() => checkAll(true)}>Check all</button>
                <button onClick={() => checkAll(false)}>Uncheck all</button>
                <button onClick={resetChecklist}>Reset</button>
              </div>
            </div>

            <div className="beardstown-checklist">
              <ChecklistItem 
                id="s1a" 
                checked={checkedItems.s1a || false}
                onChange={handleCheckChange}
                text="Step 1 – Understand the Business: Do you know what the company actually does?"
              />
              <ChecklistItem 
                id="s1b" 
                checked={checkedItems.s1b || false}
                onChange={handleCheckChange}
                text="Do you (or your family) use its products or services?"
              />
              <ChecklistItem 
                id="s1c" 
                checked={checkedItems.s1c || false}
                onChange={handleCheckChange}
                text="Is its business model simple and durable?"
              />
              
              {/* Step 2 */}
              <ChecklistItem 
                id="s2a" 
                checked={checkedItems.s2a || false}
                onChange={handleCheckChange}
                text="Step 2 – Examine the Numbers: EPS shows consistent growth for 3–5 years?"
              />
              <ChecklistItem 
                id="s2b" 
                checked={checkedItems.s2b || false}
                onChange={handleCheckChange}
                text="Debt-to-equity is manageable (preferably under 1.0)?"
              />
              <ChecklistItem 
                id="s2c" 
                checked={checkedItems.s2c || false}
                onChange={handleCheckChange}
                text="Profit margins are stable or improving?"
              />
              <ChecklistItem 
                id="s2d" 
                checked={checkedItems.s2d || false}
                onChange={handleCheckChange}
                text="Return on equity (ROE) above 10%?"
              />

              {/* Step 3 */}
              <ChecklistItem 
                id="s3a" 
                checked={checkedItems.s3a || false}
                onChange={handleCheckChange}
                text="Step 3 – Look at Valuation: P/E is reasonable vs. peers?"
              />
              <ChecklistItem 
                id="s3b" 
                checked={checkedItems.s3b || false}
                onChange={handleCheckChange}
                text="Dividend yield is consistent and growing?"
              />
              <ChecklistItem 
                id="s3c" 
                checked={checkedItems.s3c || false}
                onChange={handleCheckChange}
                text="Payout ratio under 60% for sustainability?"
              />

              {/* Step 4 */}
              <ChecklistItem 
                id="s4a" 
                checked={checkedItems.s4a || false}
                onChange={handleCheckChange}
                text="Step 4 – Check the Story: Is a long-term trend supporting the business?"
              />
              <ChecklistItem 
                id="s4b" 
                checked={checkedItems.s4b || false}
                onChange={handleCheckChange}
                text="Management credibility checked (calls, letters, filings)?"
              />
              <ChecklistItem 
                id="s4c" 
                checked={checkedItems.s4c || false}
                onChange={handleCheckChange}
                text="Assessed regulatory/reputation/technology risks?"
              />

              {/* Step 5-7 */}
              <ChecklistItem 
                id="s5a" 
                checked={checkedItems.s5a || false}
                onChange={handleCheckChange}
                text="Step 5 – Club Discussion: Research presented, questions debated, compared to holdings."
              />
              <ChecklistItem 
                id="s6a" 
                checked={checkedItems.s6a || false}
                onChange={handleCheckChange}
                text="Step 6 – Vote & Record: Majority approved, amount set, thesis & review date logged."
              />
              <ChecklistItem 
                id="s7a" 
                checked={checkedItems.s7a || false}
                onChange={handleCheckChange}
                text="Step 7 – Monitor Quarterly: Earnings reviewed; thesis intact or adjust (add/trim/exit)."
              />
            </div>
          </section>

          {/* Model Portfolio */}
          <section id="portfolio" className="beardstown-card">
            <h2>Model Portfolio Structure (Modernized Beardstown-Style)</h2>
            <table className="beardstown-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Target %</th>
                  <th>Example Types or ETFs</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Core Blue-Chip Stocks / ETFs</td>
                  <td>40%</td>
                  <td>Apple, Microsoft, Johnson & Johnson, SPDR S&P 500 ETF (SPY)</td>
                  <td>Long-term stability and dividends</td>
                </tr>
                <tr>
                  <td>Dividend Growth Stocks / ETFs</td>
                  <td>25%</td>
                  <td>PepsiCo, Procter & Gamble, SCHD, VIG</td>
                  <td>Income and compounding</td>
                </tr>
                <tr>
                  <td>Growth & Innovation Stocks</td>
                  <td>20%</td>
                  <td>Nvidia, Amazon, or QQQ ETF</td>
                  <td>Capital appreciation</td>
                </tr>
                <tr>
                  <td>Value & Defensive Stocks</td>
                  <td>10%</td>
                  <td>JPMorgan, ExxonMobil, healthcare ETFs</td>
                  <td>Downside protection</td>
                </tr>
                <tr>
                  <td>Cash / Short-Term Treasury Fund</td>
                  <td>5%</td>
                  <td>SGOV, money market fund</td>
                  <td>Flexibility for new buys or downturns</td>
                </tr>
              </tbody>
            </table>
            <div className="beardstown-callout beardstown-small">
              <strong>Rules of Thumb:</strong> Reinvest all dividends; cap any one company at 10–15% of portfolio value; review annually or when allocations drift &gt; 5%.
            </div>
          </section>

          {/* Takeaways */}
          <section id="takeaways" className="beardstown-card">
            <h2>Recurring Strategies & Modern Takeaways</h2>
            <ul className="beardstown-list">
              <li><strong>Regular Contributions (Dollar-Cost Averaging):</strong> Small, steady investments beat sporadic big bets.</li>
              <li><strong>Long-Term Focus:</strong> Ignore short-term noise; let compounding work.</li>
              <li><strong>Understand What You Own:</strong> Buy businesses, not tickers.</li>
              <li><strong>Education and Community:</strong> Collective learning reduces fear and bias.</li>
              <li><strong>Transparency and Accountability:</strong> Track results, own mistakes, learn from them.</li>
              <li><strong>Dividends and Patience:</strong> Let reinvested dividends grow wealth quietly over time.</li>
              <li><strong>Simplicity Over Complexity:</strong> Complexity sells funds; simplicity builds fortunes.</li>
            </ul>
            <p className="beardstown-muted">
              Historical context: the Ladies' returns were later shown to be overstated, yet their cultural impact was real. Their process—discipline, record-keeping, education—foreshadowed today's financial literacy and low-cost, long-horizon investing culture.
            </p>
          </section>
        </main>
      </div>
      </div>
    </Page>
  );
};

// Checklist Item Component
const ChecklistItem = ({ id, checked, onChange, text }) => (
  <div className="beardstown-check-item">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(id, e.target.checked)}
    />
    <div>{text}</div>
  </div>
);

export default BeardstownLadies;