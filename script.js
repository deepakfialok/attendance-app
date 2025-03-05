let data = {};

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

function loadClassStudents(classId, timing) {
  const classData = data.classes[classId];
  const studentsHtml = classData.students
    .map((studentId) => {
      const student = data.students[studentId];
      const imageNumber = hashString(studentId); // Generate a unique number for the student
      const imageUrl = `https://randomuser.me/api/portraits/${
        student.gender === "male" ? "men" : "women"
      }/${imageNumber}.jpg`;
      return `
        <div class="card student-card" id="student-${studentId}">
          <img src="${imageUrl}" alt="${student.name}">
          <h3>${student.name}</h3>
          <p>ID: ${studentId}</p>
          <button onclick="markStudentAttendance('${classId}', '${studentId}', 'Present', '${timing}')">Present</button>
          <button onclick="markStudentAttendance('${classId}', '${studentId}', 'Absent', '${timing}')">Absent</button>
        </div>
      `;
    })
    .join("");
  document.getElementById("content").innerHTML = `
      <div>
        <h2>${classData.className} - ${timing}</h2>
        <div class="grid">${studentsHtml}</div>
      </div>
    `;
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

function markStudentAttendance(classId, studentId, status, timing) {
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

    // Animate and remove the student card
    const studentCard = document.getElementById(`student-${studentId}`);
    if (studentCard) {
      studentCard.classList.add("animation-fade-out");
      setTimeout(() => studentCard.remove(), 500);
    }
  }
}

function loadAnalytics() {
  document.getElementById("content").innerHTML = `
    <h2>Analytics</h2>
    <button onclick="loadClassWiseAttendance()">Class-wise Attendance</button>
    <button onclick="loadTeacherWiseAttendance()">Teacher-wise Attendance</button>
    <button onclick="loadStudentWiseAttendance()">Student-wise Attendance</button>
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
        presentStudents.push({ ...student, id: studentId, imageUrl });
      } else if (attendanceRecord.status === "Absent") {
        absentStudents.push({ ...student, id: studentId, imageUrl });
      }
    } else {
      // Only include students with no attendance record if explicitly marked as absent
      // If you want to show all students with no record as absent, uncomment the next line
      // absentStudents.push({ ...student, id: studentId, imageUrl });
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
