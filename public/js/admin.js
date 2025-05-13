document.addEventListener('DOMContentLoaded', () => {
  // Load system overview
  function loadSystemOverview() {
    fetch('/api/admin/analytics')
      .then(response => response.json())
      .then(data => {
        // Update user stats
        document.getElementById('total-users').textContent = data.users.total;
        document.getElementById('student-count').textContent = data.users.students;
        document.getElementById('teacher-count').textContent = data.users.teachers;
        document.getElementById('admin-count').textContent = data.users.admins;
        
        // Update course stats
        document.getElementById('total-courses').textContent = data.courses.total;
        document.getElementById('approved-courses').textContent = data.courses.approved;
        document.getElementById('pending-courses').textContent = data.courses.pending;
        
        // Update assignment stats
        document.getElementById('total-assignments').textContent = data.assignments;
        
        // Update submission stats
        document.getElementById('total-submissions').textContent = data.submissions.total;
        document.getElementById('graded-submissions').textContent = data.submissions.graded;
        document.getElementById('pending-submissions').textContent = data.submissions.pending;
        
        // Simple charts using ASCII art (in a real app, you'd use a charting library)
        renderSimpleCharts(data);
      })
      .catch(error => {
        console.error('Error loading analytics:', error);
      });
  }
  
  // Render simple charts (placeholder for real charts)
  function renderSimpleCharts(data) {
    // User distribution chart
    const userChart = document.getElementById('user-chart');
    userChart.innerHTML = `
      <div style="text-align: center;">
        <div>Students: ${data.users.students} (${Math.round(data.users.students / data.users.total * 100)}%)</div>
        <div>Teachers: ${data.users.teachers} (${Math.round(data.users.teachers / data.users.total * 100)}%)</div>
        <div>Admins: ${data.users.admins} (${Math.round(data.users.admins / data.users.total * 100)}%)</div>
      </div>
    `;
    
    // Course status chart
    const courseChart = document.getElementById('course-chart');
    courseChart.innerHTML = `
      <div style="text-align: center;">
        <div>Approved: ${data.courses.approved} (${Math.round(data.courses.approved / data.courses.total * 100)}%)</div>
        <div>Pending: ${data.courses.pending} (${Math.round(data.courses.pending / data.courses.total * 100)}%)</div>
      </div>
    `;
    
    // Submission status chart
    const submissionChart = document.getElementById('submission-chart');
    submissionChart.innerHTML = `
      <div style="text-align: center;">
        <div>Graded: ${data.submissions.graded} (${Math.round(data.submissions.graded / data.submissions.total * 100)}%)</div>
        <div>Pending: ${data.submissions.pending} (${Math.round(data.submissions.pending / data.submissions.total * 100)}%)</div>
      </div>
    `;
  }
  
  // Load users
  function loadUsers(role = 'all') {
    const usersTableBody = document.getElementById('users-table-body');
    usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">Loading users...</td></tr>';
    
    fetch('/api/admin/users')
      .then(response => response.json())
      .then(users => {
        if (users.length === 0) {
          usersTableBody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
          return;
        }
        
        // Filter users by role if needed
        if (role !== 'all') {
          users = users.filter(user => user.role === role);
        }
        
        if (users.length === 0) {
          usersTableBody.innerHTML = `<tr><td colspan="5">No ${role}s found.</td></tr>`;
          return;
        }
        
        let html = '';
        users.forEach(user => {
          html += `
            <tr>
              <td>${user.fullName}</td>
              <td>${user.username}</td>
              <td>${user.email}</td>
              <td>${user.role}</td>
              <td>
                <button class="btn btn-primary edit-user-btn" data-id="${user._id}" data-name="${user.fullName}" data-username="${user.username}" data-email="${user.email}" data-role="${user.role}">Edit</button>
              </td>
            </tr>
          `;
        });
        
        usersTableBody.innerHTML = html;
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-user-btn').forEach(button => {
          button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const email = this.getAttribute('data-email');
            const role = this.getAttribute('data-role');
            
            openEditUserModal(userId, name, email, role);
          });
        });
      })
      .catch(error => {
        console.error('Error loading users:', error);
        usersTableBody.innerHTML = '<tr><td colspan="5" class="error">Failed to load users. Please try again later.</td></tr>';
      });
  }
  
  // Open edit user modal
  function openEditUserModal(userId, name, email, role) {
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-user-name').value = name;
    document.getElementById('edit-user-email').value = email;
    document.getElementById('edit-user-role').value = role;
    
    openModal('edit-user-modal');
  }
  
  // Update user role
  function updateUserRole(userId, role) {
    fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role })
    })
    .then(response => response.json())
    .then(data => {
      if (data.user) {
        alert('User role updated successfully!');
        closeModal('edit-user-modal');
        
        // Reload users
        const roleFilter = document.getElementById('user-role-filter').value;
        loadUsers(roleFilter);
        
        // Reload overview
        loadSystemOverview();
      } else {
        alert(data.message || 'Failed to update user role.');
      }
    })
    .catch(error => {
      console.error('Error updating user role:', error);
      alert('An error occurred. Please try again.');
    });
  }
  
  // Delete user
  function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'User deleted successfully') {
        alert('User deleted successfully!');
