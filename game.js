import { setTeams } from './teams.js';
import { getTeams } from './teams.js'; 

// Function to get a query parameter from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Fetch active users with AFK=false
async function fetchActiveUsersFromBin() {
  const binId = '65a69d37266cfc3fde7984aa'; // Your Bin ID
  const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.'; // Replace with your JSONBin.io API key

  const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
          'X-Master-Key': apiKey
      }
  });

  if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data.record.users.filter(user => !user.afk); // Filter active users
}

async function randomizeTeams(matchSetting) {
  try {
      const activeUsers = await fetchActiveUsersFromBin();

      // Extract the number of players per team from the match setting
      const maxPlayersPerTeam = parseInt(matchSetting[0]);

      // Shuffle the activeUsers array randomly
      const shuffledUsers = shuffleArray(activeUsers);

      // Initialize empty teams, their total points, and the bench
      const teamRed = [];
      const teamYellow = [];
      const teamBench = [];

      // Distribute users to balance teams based on totalPoints
      let totalPointsRed = 0, totalPointsYellow = 0;
      shuffledUsers.forEach(user => {
          if (teamRed.length < maxPlayersPerTeam && (totalPointsRed <= totalPointsYellow || teamYellow.length === maxPlayersPerTeam)) {
              teamRed.push(user);
              totalPointsRed += user.totalPoints;
          } else if (teamYellow.length < maxPlayersPerTeam) {
              teamYellow.push(user);
              totalPointsYellow += user.totalPoints;
          } else {
              teamBench.push(user);
          }
      });

      // Use setTeams to update the team data
      setTeams(teamRed, teamYellow, teamBench);

      // Display the teams and the bench on the "game.html" page
      displayTeams();
  } catch (error) {
      console.error('Error randomizing teams:', error);
  }
}

// Function to shuffle an array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to display teams on "game.html"
function displayTeams() {

  const { teamRed, teamYellow, teamBench } = getTeams();

  const teamRedElement = document.getElementById('teamRed');
  const teamYellowElement = document.getElementById('teamYellow');
  const teamBenchElement = document.getElementById('teamBench');

  // Clear the existing content
  teamRedElement.innerHTML = '';
  teamYellowElement.innerHTML = '';
  teamBenchElement.innerHTML = '';

  // Loop through and display Team Red members
  teamRed.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.textContent = user.name;
      teamRedElement.appendChild(userDiv);
  });

  // Loop through and display Team Yellow members
  teamYellow.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.textContent = user.name;
      teamYellowElement.appendChild(userDiv);
  });

    // Loop through and display Team Bench members
    teamBench.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.textContent = user.name;
      teamBenchElement.appendChild(userDiv);
  });
}

// Call the randomizeTeams function when the page loads
document.addEventListener('DOMContentLoaded', function () {
  const matchSetting = getQueryParam('matchSetting');
  randomizeTeams(matchSetting);
});

async function updateBin(binId, data, apiKey) {
  try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': apiKey
          },
          body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      console.log(`Data saved successfully to bin: ${binId}`);
  } catch (error) {
      console.error('Error saving data:', error);
  }
}

document.getElementById('goLiveButton').addEventListener('click', async function() {
  const goLiveButton = document.getElementById('goLiveButton');
  goLiveButton.textContent = 'Going live...please wait a few seconds..'; // Update button text to indicate processing
  goLiveButton.disabled = true; // Optionally disable the button to prevent multiple clicks

  const { teamRed, teamYellow, teamBench } = getTeams();
  const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.'; // Replace with your actual API key

  try {
    await updateBin('65a7e6c71f5677401f1f48c1', { teamRed: teamRed }, apiKey); // Update teamRed bin
    await updateBin('65a7e70adc7465401894b78a', { teamYellow: teamYellow }, apiKey); // Update teamYellow bin
    await updateBin('65a7e72bdc7465401894b7a7', { teamBench: teamBench }, apiKey); // Update teamBench bin  

    window.location.href = 'live.html'; // Navigate to live.html
  } catch (error) {
    console.error('Error during live update:', error);
    goLiveButton.textContent = 'GO LIVE'; // Revert button text if there's an error
    goLiveButton.disabled = false; // Re-enable the button
  }
});
