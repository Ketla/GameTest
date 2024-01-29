document.addEventListener('DOMContentLoaded', async function () {
  const userForm = document.getElementById('userForm');
  const userList = document.getElementById('userList');

  async function fetchAndDisplayUsers(userList) {
    try {
        const users = await fetchUsersFromBin();
        // Clear current user list before adding new users
        userList.innerHTML = ''; 
        users.forEach(user => addUserToList(user, userList));

        // After adding users, update the player counts
        displayPlayerCounts(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        userList.innerHTML = 'Error fetching users.';
    }
  }

  userForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('userName').value;
    const afk = false;
    const totalPoints = 0;
    const benched = 0;

    // Generate a unique ID for the user
    const userId = 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const user = { id: userId, name, afk, totalPoints, benched };

    // Display "Adding user..." message
    userList.innerHTML = 'Adding user...';

    try {
        await addUserToBin(user);
        // Fetch and display updated users after adding user
        await fetchAndDisplayUsers(userList);
    } catch (error) {
        console.error('Error adding user:', error);
        userList.innerHTML = 'Error adding user. Please try again.';
    }
  });

  // Fetch and display users when the page loads
  await fetchAndDisplayUsers(userList);
});

async function fetchUsersFromBin() {
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
  return data.record.users;
}

async function addUserToBin(user) {
  const binId = '65a69d37266cfc3fde7984aa'; // Your Bin ID
  const apiKey = '$2a$10$lx.0aczVGbFUh6i4EKyM..Hu00fZbSaq528KFgAgZAxoav8D7Ddb.'; // Replace with your JSONBin.io API key

  try {
      // Fetch the existing data
      let response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          method: 'GET',
          headers: {
              'X-Master-Key': apiKey
          }
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      let data = await response.json();
      
      // Add new user to the existing data
      data.record.users.push(user);

      // Send the updated data back to JSONBin
      response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': apiKey
          },
          body: JSON.stringify(data.record)
      });

      if (!response.ok) throw Error(`HTTP error! Status: ${response.status}`);

      console.log('User added successfully', await response.json());
  } catch (error) {
      console.error('Error adding user:', error);
  }
}

function addUserToList(user, userList) {
  const userDiv = document.createElement('div');

  if (user.afk) {
    userDiv.classList.add('afk-user');
  }

  userDiv.innerHTML = `
      <p>Name: ${user.name}</p>
      <p>AFK: ${user.afk ? 'Yes' : 'No'}</p>
  `;
  userList.appendChild(userDiv);
}

function displayPlayerCounts(users) {
  let activeCount = 0;
  let inactiveCount = 0;

  // Calculate counts based on AFK status
  users.forEach(user => {
      if (user.afk) {
          inactiveCount++;
      } else {
          activeCount++;
      }
  });

  // Update the count elements
  const activeCountElement = document.getElementById('activeCount');
  const inactiveCountElement = document.getElementById('inactiveCount');
  
  activeCountElement.textContent = `Active Players: ${activeCount}`;
  inactiveCountElement.textContent = `Inactive Players: ${inactiveCount}`;

      // Update match settings dropdown
      updateMatchSettingsDropdown(activeCount);
}

function updateMatchSettingsDropdown(activePlayers) {
  const matchSettingsDropdown = document.getElementById('matchSettingsDropdown');
  matchSettingsDropdown.innerHTML = ''; // Clear existing options

  // Calculate maximum match setting based on active players (half, rounded down)
  let maxMatchSetting = Math.floor(activePlayers / 2);

  for (let i = 1; i <= maxMatchSetting; i++) {
      const option = document.createElement('option');
      option.value = `${i}v${i}`;
      option.textContent = `${i}v${i}`;
      matchSettingsDropdown.appendChild(option);
  }
}

document.getElementById('startGameButton').addEventListener('click', function() {
  const selectedOption = document.getElementById('matchSettingsDropdown').value;
  window.location.href = `game.html?matchSetting=${selectedOption}`;
});
