// Grab DOM elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const appContainer = document.getElementById('appContainer');
const loginContainer = document.getElementById('loginContainer');
const signupContainer = document.getElementById('signupContainer');
const logoutBtn = document.getElementById('logoutBtn');
const transactionForm = document.getElementById('transactionForm');
const transactionList = document.getElementById('transactionList');
const balanceDiv = document.getElementById('balance');

let currentUserId = null; // store MongoDB userId after login

// 🔐 Handle Signup
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    alert('Signup failed: ' + err.message);
  }
});

// 🔑 Handle Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUserId = data.userId; // store MongoDB userId
      loginContainer.style.display = 'none';
      signupContainer.style.display = 'none';
      appContainer.style.display = 'block';
      loadTransactions();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
});

// 🚪 Handle Logout
logoutBtn.addEventListener('click', () => {
  currentUserId = null;
  appContainer.style.display = 'none';
  loginContainer.style.display = 'block';
  signupContainer.style.display = 'block';
});

// ➕ Handle Transactions
transactionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;

  try {
    const res = await fetch(`/api/transactions/${currentUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount, type })
    });
    const data = await res.json();
    if (data.success) {
      loadTransactions();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Transaction failed: ' + err.message);
  }
});

// 📊 Load Transactions
async function loadTransactions() {
  try {
    const res = await fetch(`/api/transactions/${currentUserId}`);
    const data = await res.json();

    transactionList.innerHTML = '';
    let balance = 0;

    data.forEach(tx => {
      const row = document.createElement('div');
      row.classList.add('transaction', tx.type); // still adds income/expense class for background

      // Left side: description
      const left = document.createElement('div');
      left.classList.add('transaction-left');
      left.textContent = tx.description;

      // Right side: amount + delete button
      const right = document.createElement('div');
      right.classList.add('transaction-right');

      const amount = document.createElement('span');
      amount.classList.add('transaction-amount');
      amount.textContent = `$${tx.amount.toFixed(2)}`;
      // ❌ removed inline color so it stays black

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.classList.add('delete-btn');
      delBtn.onclick = async () => {
        await fetch(`/api/transactions/${tx._id}`, { method: 'DELETE' });
        loadTransactions();
      };

      right.appendChild(amount);
      right.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(right);
      transactionList.appendChild(row);

      balance += tx.type === 'income' ? tx.amount : -tx.amount;
    });

    updateBalanceDisplay(balance);
  } catch (err) {
    alert('Failed to load transactions: ' + err.message);
  }
}

    // ✅ Call the helper here
    function updateBalanceDisplay(balance) {
  balanceDiv.textContent = `Balance: $${balance.toFixed(2)}`;

  if (balance > 0) {
    balanceDiv.style.color = 'green';
  } else if (balance < 0) {
    balanceDiv.style.color = 'red';
  } else {
    balanceDiv.style.color = 'gray';
  }
}

// 🎨 Balance formatting helper
function updateBalanceDisplay(balance) {
  balanceDiv.textContent = `Balance: $ ${balance.toFixed(2)}`;

  if (balance > 0) {
    balanceDiv.style.color = 'green';
  } else if (balance < 0) {
    balanceDiv.style.color = 'red';
  } else {
    balanceDiv.style.color = 'gray';
  }
}