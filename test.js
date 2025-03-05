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
    .map(
      (studentId) => `
    <div class="card student-card">
      <img src="https://randomuser.me/api/portraits/${
        Math.random() > 0.5 ? "men" : "women"
      }/${Math.floor(Math.random() * 100)}.jpg" alt="${
        data.students[studentId].name
      }">
      <h3>${data.students[studentId].name}</h3>
      <button onclick="markAttendance('${classId}', '${studentId}')">Mark Present</button>
    </div>
  `
    )
    .join("");
  document.getElementById(
    "content"
  ).innerHTML = `<div class="grid">${studentsHtml}</div>`;
}

function markAttendance(classId, studentId) {
  if (confirm(`Mark ${data.students[studentId].name} as present?`)) {
    alert(`${data.students[studentId].name} marked present`);
    // Save to local storage or update data.attendance
  }
}

function loadTeacherMode() {
  const teachersHtml = Object.entries(data.teachers)
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
    .map(
      (studentId) => `
    <div class="card student-card" id="student-${studentId}">
      <img src="https://randomuser.me/api/portraits/${
        Math.random() > 0.5 ? "men" : "women"
      }/${Math.floor(Math.random() * 100)}.jpg" alt="${
        data.students[studentId].name
      }">
      <h3>${data.students[studentId].name}</h3>
      <p>ID: ${studentId}</p>
      <button onclick="markStudentAttendance('${classId}', '${studentId}', 'Present', '${timing}')">Present</button>
      <button onclick="markStudentAttendance('${classId}', '${studentId}', 'Absent', '${timing}')">Absent</button>
    </div>
  `
    )
    .join("");
  document.getElementById("content").innerHTML = `
    <div>
      <h2>${classData.className} - ${timing}</h2>
      <div class="grid">${studentsHtml}</div>
    </div>
  `;
}

function markStudentAttendance(classId, studentId, status, timing) {
  const datePicker = document.querySelector(".date-picker");
  const date = datePicker
    ? datePicker.value
    : new Date().toISOString().split("T")[0];

  if (confirm(`Mark ${data.students[studentId].name} as ${status}?`)) {
    const attendanceRecord = {
      classID: classId,
      className: data.classes[classId].className,
      date: date,
      time: timing,
      teacherID: Object.keys(data.teachers).find((teacherId) =>
        data.teachers[teacherId].classes.includes(classId)
      ),
      students: {
        [studentId]: status,
      },
    };
    localStorage.setItem(
      `attendance-${Date.now()}`,
      JSON.stringify(attendanceRecord)
    );

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
