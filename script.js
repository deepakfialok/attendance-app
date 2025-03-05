let data = {};

let currentChart = null; // Track the current chart instance
function clearChart() {
  if (currentChart) {
    currentChart.destroy(); // Destroy the existing chart
    currentChart = null;
  }
}

// Fetch data from data.json
fetch("data.json")
  .then((response) => response.json())
  .then((json) => {
    data = json;
    loadHomePage(); // Load the homepage when data is fetched
  })
  .catch((error) => console.error("Error loading data:", error));

function loadHomePage() {
  document.getElementById("content").innerHTML = `
      <button onclick="loadStudentMode()">Student Mode</button>
      <button onclick="loadTeacherMode()">Teacher Mode</button>
      <button onclick="loadAnalytics()">Analytics</button>
      <button onclick="loadAttendanceStatus()">Attendance Status</button>
    `;
}

function loadStudentMode() {
  const classesHtml = Object.entries(data.classes)
    .map(
      ([id, cls]) => `
    <div class="card class-card" onclick="loadStudentAttendance('${id}')">
      <h3>${cls.className}</h3>
      <p>Time: ${cls.time}</p>
    </div>
  `
    )
    .join("");
  document.getElementById(
    "content"
  ).innerHTML = `<div class="grid">${classesHtml}</div>`;
}

function loadStudentAttendance(classId) {
  const classData = data.classes[classId];
  const studentsHtml = classData.students
    .map((studentId) => {
      const student = data.students[studentId];
      const imageNumber = hashString(studentId); // Generate a unique number for the student
      const imageUrl = `https://randomuser.me/api/portraits/${
        student.gender === "male" ? "men" : "women"
      }/${imageNumber}.jpg`;
      return `
      <div class="card student-card">
        <img src="${imageUrl}" alt="${student.name}">
        <h3>${student.name}</h3>
        <p>ID: ${studentId}</p>
        <button onclick="markAttendance('${classId}', '${studentId}')">Mark Present</button>
      </div>
    `;
    })
    .join("");
  document.getElementById(
    "content"
  ).innerHTML = `<div class="grid">${studentsHtml}</div>`;
}

function markAttendance(classId, studentId) {
  const datePicker = document.getElementById("date-picker");
  const date = datePicker ? datePicker.value : null;

  // Check if date is selected
  if (!date) {
    alert("Please select a date before marking attendance.");
    return;
  }

  const masterAttendance = getMasterAttendance();
  const attendanceKey = `${classId}-${studentId}-${date}-${data.classes[classId].timings[0]}`; // Use the first timing for simplicity

  // Check if attendance is already marked
  if (masterAttendance[attendanceKey]) {
    alert(
      `Attendance for ${data.students[studentId].name} on ${date} has already been marked.`
    );
    return;
  }

  if (confirm(`Mark ${data.students[studentId].name} as present?`)) {
    const attendanceRecord = {
      classID: classId,
      className: data.classes[classId].className,
      date: date,
      time: data.classes[classId].timings[0], // Use the first timing for simplicity
      teacherID: Object.keys(data.teachers).find((teacherId) =>
        data.teachers[teacherId].classes.includes(classId)
      ),
      studentID: studentId,
      studentName: data.students[studentId].name,
      status: "Present",
    };

    // Add the record to the master attendance object
    masterAttendance[attendanceKey] = attendanceRecord;
    saveMasterAttendance(masterAttendance);

    alert(
      `${data.students[studentId].name} marked present for ${data.classes[classId].className} on ${date}.`
    );
  }
}

function loadTeacherMode() {
  const teachersHtml = Object.entries(data.teachers)
    .map(([id, teacher]) => {
      const imageNumber = hashString(id); // Generate a unique number for the teacher
      const imageUrl = `https://randomuser.me/api/portraits/${
        teacher.gender === "male" ? "men" : "women"
      }/${imageNumber}.jpg`;
      return `
        <div class="card teacher-card" onclick="loadTeacherClasses('${id}')">
          <img src="${imageUrl}" alt="${teacher.teacherName}">
          <h3>${teacher.teacherName}</h3>
          <p>ID: ${id}</p>
        </div>
      `;
    })
    .join("");

  document.getElementById("content").innerHTML = `
      <div>
        <input type="text" class="search-box" placeholder="Search by teacher name" oninput="searchTeachers(this.value)">
        <div class="grid">${teachersHtml}</div>
      </div>
    `;
}

function searchTeachers(query) {
  const filteredTeachers = Object.entries(data.teachers).filter(
    ([id, teacher]) =>
      teacher.teacherName.toLowerCase().includes(query.toLowerCase())
  );
  const teachersHtml = filteredTeachers
    .map(
      ([id, teacher]) => `
    <div class="card teacher-card" onclick="loadTeacherClasses('${id}')">
      <img src="${teacher.profileImage}" alt="${teacher.teacherName}">
      <h3>${teacher.teacherName}</h3>
      <p>ID: ${id}</p>
    </div>
  `
    )
    .join("");
  document.querySelector(".grid").innerHTML = teachersHtml;
}

function loadTeacherClasses(teacherId) {
  const teacher = data.teachers[teacherId];
  const classesHtml = teacher.classes
    .map(
      (classId) => `
    <div class="card class-card" onclick="loadClassTimings('${classId}')">
      <h3>${data.classes[classId].className}</h3>
      <p>ID: ${classId}</p>
    </div>
  `
    )
    .join("");
  document.getElementById("content").innerHTML = `
    <div>
      <input type="text" class="search-box" placeholder="Search by class name" oninput="searchClasses(this.value, '${teacherId}')">
      <div class="grid">${classesHtml}</div>
    </div>
  `;
}

function searchClasses(query, teacherId) {
  const teacher = data.teachers[teacherId];
  const filteredClasses = teacher.classes.filter((classId) =>
    data.classes[classId].className.toLowerCase().includes(query.toLowerCase())
  );
  const classesHtml = filteredClasses
    .map(
      (classId) => `
    <div class="card class-card" onclick="loadClassTimings('${classId}')">
      <h3>${data.classes[classId].className}</h3>
      <p>ID: ${classId}</p>
    </div>
  `
    )
    .join("");
  document.querySelector(".grid").innerHTML = classesHtml;
}

function loadClassTimings(classId) {
  const classData = data.classes[classId];
  if (!classData || !classData.timings) {
    console.error(`Class data or timings not found for class ID: ${classId}`);
    return;
  }

  const timingsHtml = classData.timings
    .map(
      (timing) => `
    <div class="card timing-card" onclick="loadClassStudents('${classId}', '${timing}')">
      <h3>${timing}</h3>
    </div>
  `
    )
    .join("");

  document.getElementById("content").innerHTML = `
    <div>
      <h2>${classData.className}</h2>
      <div class="grid">${timingsHtml}</div>
    </div>
  `;
}

let selectedStudents = new Set(); // Track selected students

function loadClassStudents(classId, timing) {
  selectedStudents.clear(); // Clear previous selections
  const datePicker = document.getElementById("date-picker");
  const date = datePicker ? datePicker.value : null;

  if (!date) {
    alert("Please select a date before loading students.");
    return;
  }

  const masterAttendance = getMasterAttendance();
  const classData = data.classes[classId];
  const studentsHtml = classData.students
    .filter((studentId) => {
      const attendanceKey = `${classId}-${studentId}-${date}-${timing}`;
      return !masterAttendance[attendanceKey]; // Only include students who haven't been marked
    })
    .map((studentId) => {
      const student = data.students[studentId];
      const imageNumber = hashString(studentId); // Generate a unique number for the student
      const imageUrl = `https://randomuser.me/api/portraits/${
        student.gender === "male" ? "men" : "women"
      }/${imageNumber}.jpg`;
      return `
        <div class="card student-card" id="student-${studentId}" onclick="toggleStudentSelection('${studentId}')">
          <img src="${imageUrl}" alt="${student.name}">
          <h3>${student.name}</h3>
          <p>ID: ${studentId}</p>
          <button class="present-button" onclick="markStudentAttendance('${classId}', '${studentId}', 'Present', '${timing}', event)">Present</button>
          <button class="absent-button" onclick="markStudentAttendance('${classId}', '${studentId}', 'Absent', '${timing}', event)">Absent</button>
        </div>
      `;
    })
    .join("");

  document.getElementById("content").innerHTML = `
    <div>
      <h2>${classData.className} - ${timing}</h2>
      <div id="selected-count">0 students selected</div>
      <div id="bulk-actions">
        <button class="present-button" onclick="markBulkAttendance('${classId}', 'Present', '${timing}')">Mark Present</button>
        <button class="absent-button" onclick="markBulkAttendance('${classId}', 'Absent', '${timing}')">Mark Absent</button>
      </div>
      <div class="grid">${studentsHtml}</div>
    </div>
  `;
} // Track selected students
function loadClassStudents(classId, timing) {
  selectedStudents.clear(); // Clear previous selections
  const datePicker = document.getElementById("date-picker");
  const date = datePicker ? datePicker.value : null;

  if (!date) {
    alert("Please select a date before loading students.");
    return;
  }

  const masterAttendance = getMasterAttendance();
  const classData = data.classes[classId];
  const studentsHtml = classData.students
    .filter((studentId) => {
      const attendanceKey = `${classId}-${studentId}-${date}-${timing}`;
      return !masterAttendance[attendanceKey]; // Only include students who haven't been marked
    })
    .map((studentId) => {
      const student = data.students[studentId];
      const imageNumber = hashString(studentId); // Generate a unique number for the student
      const imageUrl = `https://randomuser.me/api/portraits/${
        student.gender === "male" ? "men" : "women"
      }/${imageNumber}.jpg`;
      return `
        <div class="card student-card" id="student-${studentId}" onclick="toggleStudentSelection('${studentId}')">
          <img src="${imageUrl}" alt="${student.name}">
          <h3>${student.name}</h3>
          <p>ID: ${studentId}</p>
          <button class="present-button" onclick="markStudentAttendance('${classId}', '${studentId}', 'Present', '${timing}', event)">Present</button>
          <button class="absent-button" onclick="markStudentAttendance('${classId}', '${studentId}', 'Absent', '${timing}', event)">Absent</button>
        </div>
      `;
    })
    .join("");

  document.getElementById("content").innerHTML = `
    <div>
      <h2>${classData.className} - ${timing}</h2>
      <div id="selected-count">0 students selected</div>
      <div id="select-all-actions">
        <button onclick="selectAllStudents()">Select All</button>
        <button class="unselect-all" onclick="unselectAllStudents()">Unselect All</button>
      </div>
      <div id="bulk-actions">
        <button class="present-button" onclick="markBulkAttendance('${classId}', 'Present', '${timing}')">Mark Present</button>
        <button class="absent-button" onclick="markBulkAttendance('${classId}', 'Absent', '${timing}')">Mark Absent</button>
      </div>
      <div class="grid">${studentsHtml}</div>
    </div>
  `;
}

function toggleStudentSelection(studentId) {
  const studentCard = document.getElementById(`student-${studentId}`);
  if (selectedStudents.has(studentId)) {
    selectedStudents.delete(studentId);
    studentCard.classList.remove("selected");
  } else {
    selectedStudents.add(studentId);
    studentCard.classList.add("selected");
  }
  updateSelectedCount();
}

function updateSelectedCount() {
  const selectedCount = document.getElementById("selected-count");
  selectedCount.textContent = `${selectedStudents.size} students selected`;
}

// Function to get the master attendance record from localStorage
function getMasterAttendance() {
  const masterAttendance = localStorage.getItem("attendanceMaster");
  return masterAttendance ? JSON.parse(masterAttendance) : {};
}

// Function to save the master attendance record to localStorage
function saveMasterAttendance(masterAttendance) {
  localStorage.setItem("attendanceMaster", JSON.stringify(masterAttendance));
}

function markStudentAttendance(classId, studentId, status, timing, event) {
  event.stopPropagation(); // Prevent the card click event from firing
  const datePicker = document.getElementById("date-picker");
  const date = datePicker ? datePicker.value : null;

  // Check if date is selected
  if (!date) {
    alert("Please select a date before marking attendance.");
    return;
  }

  const masterAttendance = getMasterAttendance();
  const attendanceKey = `${classId}-${studentId}-${date}-${timing}`;

  // Check if attendance is already marked
  if (masterAttendance[attendanceKey]) {
    alert(
      `Attendance for ${data.students[studentId].name} on ${date} at ${timing} has already been marked.`
    );
    return;
  }

  if (confirm(`Mark ${data.students[studentId].name} as ${status}?`)) {
    const attendanceRecord = {
      classID: classId,
      className: data.classes[classId].className,
      date: date,
      time: timing,
      teacherID: Object.keys(data.teachers).find((teacherId) =>
        data.teachers[teacherId].classes.includes(classId)
      ),
      studentID: studentId,
      studentName: data.students[studentId].name,
      status: status,
    };

    // Add the record to the master attendance object
    masterAttendance[attendanceKey] = attendanceRecord;
    saveMasterAttendance(masterAttendance);

    alert(
      `${data.students[studentId].name} marked as ${status} for ${data.classes[classId].className} on ${date}.`
    );
  }
}

function loadAnalytics() {
  clearChart(); // Clear the existing chart
  document.getElementById("content").innerHTML = `
    <h2>Analytics</h2>
    <button onclick="loadClassWiseAttendance()">Class-wise Attendance</button>
    <button onclick="loadTeacherWiseAttendance()">Teacher-wise Attendance</button>
    <button onclick="loadStudentWiseAttendance()">Student-wise Attendance</button>
    <div id="chart-container" style="width: 80%; margin: 20px auto;">
      <canvas id="attendanceChart"></canvas>
    </div>
  `;
}

function loadClassWiseAttendance() {
  document.getElementById(
    "content"
  ).innerHTML = `<h2>Class-wise Attendance</h2>`;
}

function loadTeacherWiseAttendance() {
  document.getElementById(
    "content"
  ).innerHTML = `<h2>Teacher-wise Attendance</h2>`;
}

function loadStudentWiseAttendance() {
  document.getElementById(
    "content"
  ).innerHTML = `<h2>Student-wise Attendance</h2>`;
}

function clearLocalStorage() {
  // Clear all keys in localStorage
  localStorage.clear();
  alert("Local storage has been cleared. The page will now reload.");
  // Reload the page to reset the application state
  location.reload();
}

function loadAttendanceStatus() {
  document.getElementById("content").innerHTML = `
      <h2>Attendance Status</h2>
      <div>
        <label for="attendance-date">Select Date:</label>
        <input type="date" id="attendance-date" value="${
          new Date().toISOString().split("T")[0]
        }">
        <button onclick="loadClassesForAttendance()">Next</button>
      </div>
    `;
}

function loadClassesForAttendance() {
  const date = document.getElementById("attendance-date").value;
  const classesHtml = Object.entries(data.classes)
    .map(
      ([id, cls]) => `
      <div class="card class-card" onclick="loadTeachersForAttendance('${id}', '${date}')">
        <h3>${cls.className}</h3>
        <p>ID: ${id}</p>
      </div>
    `
    )
    .join("");
  document.getElementById("content").innerHTML = `
      <h2>Select Class</h2>
      <div class="grid">${classesHtml}</div>
    `;
}

function loadTeachersForAttendance(classId, date) {
  const teachersHtml = Object.entries(data.teachers)
    .map(
      ([id, teacher]) => `
      <div class="card teacher-card" onclick="loadTimingsForAttendance('${classId}', '${date}', '${id}')">
        <img src="${teacher.profileImage}" alt="${teacher.teacherName}">
        <h3>${teacher.teacherName}</h3>
        <p>ID: ${id}</p>
      </div>
    `
    )
    .join("");
  document.getElementById("content").innerHTML = `
      <h2>Select Teacher</h2>
      <div class="grid">${teachersHtml}</div>
    `;
}

function loadTimingsForAttendance(classId, date, teacherId) {
  const classData = data.classes[classId];
  const timingsHtml = classData.timings
    .map(
      (timing) => `
      <div class="card timing-card" onclick="showAttendanceStatus('${classId}', '${date}', '${teacherId}', '${timing}')">
        <h3>${timing}</h3>
      </div>
    `
    )
    .join("");
  document.getElementById("content").innerHTML = `
      <h2>Select Timing</h2>
      <div class="grid">${timingsHtml}</div>
    `;
}
function showAttendanceStatus(classId, date, teacherId, timing) {
  const masterAttendance = getMasterAttendance();
  const presentStudents = [];
  const absentStudents = [];

  // Get the list of students for the selected class
  const classData = data.classes[classId];
  const students = classData.students;

  // Check attendance for each student
  students.forEach((studentId) => {
    const attendanceKey = `${classId}-${studentId}-${date}-${timing}`;
    const attendanceRecord = masterAttendance[attendanceKey];
    const student = data.students[studentId];
    const imageNumber = hashString(studentId); // Generate a unique number for the student
    const imageUrl = `https://randomuser.me/api/portraits/${
      student.gender === "male" ? "men" : "women"
    }/${imageNumber}.jpg`;

    if (attendanceRecord) {
      if (attendanceRecord.status === "Present") {
        presentStudents.push({
          ...student,
          id: studentId,
          imageUrl,
          attendanceKey,
        });
      } else if (attendanceRecord.status === "Absent") {
        absentStudents.push({
          ...student,
          id: studentId,
          imageUrl,
          attendanceKey,
        });
      }
    }
  });

  // Generate HTML for present and absent students
  const presentHtml = presentStudents
    .map(
      (student) => `
    <div class="student-status-card present">
      <img src="${student.imageUrl}" alt="${student.name}">
      <h3>${student.name}</h3>
      <p>ID: ${student.id}</p>
      <button class="remove-button" onclick="removeAttendance('${student.attendanceKey}')">Remove</button>
    </div>
  `
    )
    .join("");

  const absentHtml = absentStudents
    .map(
      (student) => `
    <div class="student-status-card absent">
      <img src="${student.imageUrl}" alt="${student.name}">
      <h3>${student.name}</h3>
      <p>ID: ${student.id}</p>
      <button class="remove-button" onclick="removeAttendance('${student.attendanceKey}')">Remove</button>
    </div>
  `
    )
    .join("");

  // Display the results
  document.getElementById("content").innerHTML = `
    <h2>Attendance Status for ${classData.className} on ${date} at ${timing}</h2>
    <div class="attendance-status-container">
      <div class="present-list">
        <h3>Present Students</h3>
        ${presentHtml}
      </div>
      <div class="absent-list">
        <h3>Absent Students</h3>
        ${absentHtml}
      </div>
    </div>
    <button class="remove-all-button" onclick="removeAllAttendance('${classId}', '${date}', '${timing}')">Remove All</button>
  `;
}

// Simple hashing function to generate a unique number for each ID
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100; // Ensure the number is between 0 and 99
}

function loadAnalytics() {
  document.getElementById("content").innerHTML = `
    <h2>Analytics</h2>
    <button onclick="loadClassWiseAttendance()">Class-wise Attendance</button>
    <button onclick="loadTeacherWiseAttendance()">Teacher-wise Attendance</button>
    <button onclick="loadStudentWiseAttendance()">Student-wise Attendance</button>
    <div id="chart-container" style="width: 80%; margin: 20px auto;">
      <canvas id="attendanceChart"></canvas>
    </div>
  `;
}

function loadClassWiseAttendance() {
  const masterAttendance = getMasterAttendance();
  const classAttendance = {};

  // Calculate attendance percentage for each class
  Object.values(masterAttendance).forEach((record) => {
    if (!classAttendance[record.classID]) {
      classAttendance[record.classID] = { present: 0, total: 0 };
    }
    if (record.status === "Present") {
      classAttendance[record.classID].present++;
    }
    classAttendance[record.classID].total++;
  });

  const classLabels = [];
  const attendancePercentages = [];

  Object.entries(classAttendance).forEach(([classId, attendance]) => {
    const className = data.classes[classId].className;
    const percentage = (attendance.present / attendance.total) * 100;
    classLabels.push(className);
    attendancePercentages.push(percentage);
  });

  renderChart("Class-wise Attendance", classLabels, attendancePercentages);
}

function loadTeacherWiseAttendance() {
  const masterAttendance = getMasterAttendance();
  const teacherAttendance = {};

  // Calculate attendance percentage for each teacher
  Object.values(masterAttendance).forEach((record) => {
    if (!teacherAttendance[record.teacherID]) {
      teacherAttendance[record.teacherID] = { present: 0, total: 0 };
    }
    if (record.status === "Present") {
      teacherAttendance[record.teacherID].present++;
    }
    teacherAttendance[record.teacherID].total++;
  });

  const teacherLabels = [];
  const attendancePercentages = [];

  Object.entries(teacherAttendance).forEach(([teacherId, attendance]) => {
    const teacherName = data.teachers[teacherId].teacherName;
    const percentage = (attendance.present / attendance.total) * 100;
    teacherLabels.push(teacherName);
    attendancePercentages.push(percentage);
  });

  renderChart("Teacher-wise Attendance", teacherLabels, attendancePercentages);
}

function loadStudentWiseAttendance() {
  const masterAttendance = getMasterAttendance();
  const studentAttendance = {};

  // Calculate attendance percentage for each student
  Object.values(masterAttendance).forEach((record) => {
    if (!studentAttendance[record.studentID]) {
      studentAttendance[record.studentID] = { present: 0, total: 0 };
    }
    if (record.status === "Present") {
      studentAttendance[record.studentID].present++;
    }
    studentAttendance[record.studentID].total++;
  });

  const studentLabels = [];
  const attendancePercentages = [];

  Object.entries(studentAttendance).forEach(([studentId, attendance]) => {
    const studentName = data.students[studentId].name;
    const percentage = (attendance.present / attendance.total) * 100;
    studentLabels.push(studentName);
    attendancePercentages.push(percentage);
  });

  // Show top 10 students with highest attendance
  const sortedStudents = studentLabels
    .map((label, index) => ({
      label,
      percentage: attendancePercentages[index],
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);

  const topStudentLabels = sortedStudents.map((student) => student.label);
  const topStudentPercentages = sortedStudents.map(
    (student) => student.percentage
  );

  renderChart(
    "Top 10 Students with Highest Attendance",
    topStudentLabels,
    topStudentPercentages
  );
}

function renderChart(title, labels, data) {
  const ctx = document.getElementById("attendanceChart").getContext("2d");
  clearChart(); // Clear the existing chart
  currentChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Attendance Percentage",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Attendance Percentage",
          },
        },
        x: {
          title: {
            display: true,
            text: title.includes("Class")
              ? "Classes"
              : title.includes("Teacher")
              ? "Teachers"
              : "Students",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: title,
        },
      },
    },
  });
}

function markBulkAttendance(classId, status, timing) {
  if (selectedStudents.size === 0) {
    alert("Please select at least one student.");
    return;
  }

  const datePicker = document.getElementById("date-picker");
  const date = datePicker ? datePicker.value : null;

  // Check if date is selected
  if (!date) {
    alert("Please select a date before marking attendance.");
    return;
  }

  if (confirm(`Mark ${selectedStudents.size} students as ${status}?`)) {
    const masterAttendance = getMasterAttendance();
    selectedStudents.forEach((studentId) => {
      const attendanceKey = `${classId}-${studentId}-${date}-${timing}`;
      const attendanceRecord = {
        classID: classId,
        className: data.classes[classId].className,
        date: date,
        time: timing,
        teacherID: Object.keys(data.teachers).find((teacherId) =>
          data.teachers[teacherId].classes.includes(classId)
        ),
        studentID: studentId,
        studentName: data.students[studentId].name,
        status: status,
      };
      masterAttendance[attendanceKey] = attendanceRecord;

      // Remove the student card from the UI
      const studentCard = document.getElementById(`student-${studentId}`);
      if (studentCard) {
        studentCard.classList.add("animation-fade-out");
        setTimeout(() => studentCard.remove(), 500);
      }
    });
    saveMasterAttendance(masterAttendance);
    alert(`${selectedStudents.size} students marked as ${status}.`);
    selectedStudents.clear();
    updateSelectedCount();
  }
}

function viewLocalStorage() {
  const masterAttendance = getMasterAttendance();
  const formattedData = JSON.stringify(masterAttendance, null, 2); // Format the data for readability
  const popup = window.open("", "Local Storage", "width=600,height=400");
  popup.document.write(`
    <html>
      <head>
        <title>Local Storage</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          pre {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Local Storage</h1>
        <pre>${formattedData}</pre>
      </body>
    </html>
  `);
  popup.document.close();
}

function selectAllStudents() {
  const studentCards = document.querySelectorAll(".student-card");
  studentCards.forEach((card) => {
    const studentId = card.id.replace("student-", "");
    if (!selectedStudents.has(studentId)) {
      selectedStudents.add(studentId);
      card.classList.add("selected");
    }
  });
  updateSelectedCount();
}

function unselectAllStudents() {
  const studentCards = document.querySelectorAll(".student-card");
  studentCards.forEach((card) => {
    const studentId = card.id.replace("student-", "");
    selectedStudents.delete(studentId);
    card.classList.remove("selected");
  });
  updateSelectedCount();
}

function removeAttendance(attendanceKey) {
  if (confirm("Are you sure you want to remove this attendance record?")) {
    const masterAttendance = getMasterAttendance();
    delete masterAttendance[attendanceKey]; // Remove the record
    saveMasterAttendance(masterAttendance);
    alert("Attendance record removed.");
    // Reload the attendance status page
    const [classId, studentId, date, timing] = attendanceKey.split("-");
    showAttendanceStatus(classId, date, null, timing);
  }
}
function removeAllAttendance(classId, date, timing) {
  if (
    confirm(
      "Are you sure you want to remove all attendance records for this class, date, and timing?"
    )
  ) {
    const masterAttendance = getMasterAttendance();
    Object.keys(masterAttendance).forEach((key) => {
      if (key.startsWith(`${classId}-`) && key.includes(`-${date}-${timing}`)) {
        delete masterAttendance[key]; // Remove all matching records
      }
    });
    saveMasterAttendance(masterAttendance);
    alert("All attendance records removed.");
    // Reload the attendance status page
    showAttendanceStatus(classId, date, null, timing);
  }
}
