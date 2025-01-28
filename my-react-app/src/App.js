import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [block, setBlock] = useState(null);

  useEffect(() => {
    if (data) {
      // Set the default block to the last one in the data if no block is specified
      setBlock(Math.max(...data.map(entry => parseInt(entry.Time))));
    }
  }, [data]);

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV: ' + results.errors[0].message);
        } else {
          setData(results.data);
          setError(null);
        }
      },
      error: (error) => {
        setError('An error occurred while parsing the file: ' + error.message);
      }
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleBlockChange = (event) => {
    setBlock(parseInt(event.target.value));
  };

  return (
    <div className="App" onDrop={handleDrop} onDragOver={handleDragOver}>
      <header className="App-header">
        <p>Drag and drop your CSV file here</p>
        <input 
          type="number" 
          value={block || ''} 
          onChange={handleBlockChange} 
          placeholder="Enter block number"
        />
        {error && <p className="error">{error}</p>}
        {data ? (
          <Overview data={data} block={block} />
        ) : (
          <p className="no-data">No data loaded yet. Please drop a CSV file.</p>
        )}
      </header>
    </div>
  );
}

function Overview({ data, block }) {
  // Convert string amounts to numbers, handle the 'out' flow
  const processedData = data.map(entry => ({
    ...entry,
    Amount: parseFloat(entry.Amount),
    Value: parseFloat(entry.Value),
    Flow: entry.Flow === 'out' ? -1 : 1  // Assuming 'out' means negative flow
  }));

  // Filter data up to the specified or default block
  const dataUpToBlock = processedData.filter(entry => parseInt(entry.Time) <= block);

  // Calculate balance for each token up to the block
  const tokenBalances = dataUpToBlock.reduce((acc, entry) => {
    const tokenAddress = entry.TokenAddress;
    if (!acc[tokenAddress]) {
      acc[tokenAddress] = { name: tokenAddress, balance: 0 };
    }
    acc[tokenAddress].balance += entry.Amount * entry.Flow * Math.pow(10, -entry.Decimals);
    return acc;
  }, {});

  // Filter to only show tokens with balance > 0.00, using epsilon for precision
  const epsilon = 0.00000001; // Adjust this value if needed for more or less precision
  const balanceList = Object.values(tokenBalances).filter(token => token.balance > epsilon);

  // Find first and last transaction dates
  const firstTransactionDate = new Date(Math.min(...data.map(entry => parseInt(entry.Time))) * 1000).toLocaleDateString();
  const lastTransactionDate = new Date(Math.max(...data.map(entry => parseInt(entry.Time))) * 1000).toLocaleDateString();

  return (
    <div className="overview">
     
      {/* <h2>Your Financial Overview</h2>
      <div className="info-box">
        <p>First Transaction Date: <span>{firstTransactionDate}</span></p>
        <p>Last Transaction Date: <span>{lastTransactionDate}</span></p>
        <p>Total Transactions through Block {block}: <span>{dataUpToBlock.length}</span></p>
      </div> */}
      <h3>Wallet Balance at Block {block}</h3>
      {balanceList.length > 0 ? (
        <ul className="token-list">
          {balanceList.map((token, index) => (
            <li key={index}>
              <span className="token-name">{token.name}:</span> 
              <span className="token-balance">{(token.balance).toFixed(8)}</span> 
              <span className="token-unit">Tokens</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tokens with a balance greater than 0.00 found.</p>
      )}
      <h3>Assets Over Time (up to Block {block})</h3
    </div>
  );
}

export default App;
