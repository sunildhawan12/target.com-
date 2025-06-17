   const allowedLat = 26.48663382600949;
    const allowedLng = 74.63383057745538;
    const radius = 0.05;
    const URL = 'https://script.google.com/macros/s/AKfycbzhR-60-AUw2gL6_8ro7Dm3arl0exFNJ0a3n0MYPE-r-s4YwLrJDkJsT31mYk9LqqG92g/exec';

    let allData = [];

    function goToNextPage() {
      document.getElementById("welcomePage").style.display = "none";
      document.getElementById("mainContainer").style.display = "block";
    }

    function showAttendancePage() {
      const id = document.getElementById("studentId").value.trim();
      if (!id) {
        document.getElementById("submitMsg").textContent = "❌ Please enter ID.";
        document.getElementById("submitMsg").className = "status error";
        return;
      }
      document.getElementById("mainPage").style.display = "none";
      document.getElementById("attendancePage").style.display = "block";
      document.getElementById("idBox").value = id;
      checkLocation();
    }

    function showHistorySection() {
      document.getElementById("mainPage").style.display = "none";
      document.getElementById("attendancePage").style.display = "none";
      document.getElementById("extraPage").style.display = "none";
      document.getElementById("historySection").style.display = "block";
    }

    function goBackToMain() {
      document.getElementById("historySection").style.display = "none";
      document.getElementById("attendancePage").style.display = "none";
      document.getElementById("extraPage").style.display = "none";
      document.getElementById("mainPage").style.display = "block";
    }

    function goToExtraPage() {
      document.getElementById("historySection").style.display = "none";
      document.getElementById("mainPage").style.display = "none";
      document.getElementById("extraPage").style.display = "block";
    }

    function checkLocation() {
      const msg = document.getElementById('msg');
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const dist = getDistance(lat, lng, allowedLat, allowedLng);

        if (dist <= radius) {
          msg.innerHTML = "✅ Location Matched!";
          document.getElementById('idBox').disabled = false;
          document.getElementById('inBtn').disabled = false;
          document.getElementById('outBtn').disabled = false;
        } else {
          msg.innerHTML = "❌ You are not at the allowed location.";
        }
      }, () => {
        msg.innerHTML = "❌ Location permission denied.";
      });
    }

    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    async function submitAttendance(status) {
      const id = document.getElementById("idBox").value.trim();
      const msg = document.getElementById("msg");
      const loading = document.getElementById("loading");

      if (!id) {
        msg.innerHTML = '❌ Please enter ID.';
        return;
      }

      loading.style.display = "block";
      msg.innerHTML = "";

      navigator.geolocation.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const dist = getDistance(lat, lng, allowedLat, allowedLng);

        if (dist > radius) {
          loading.style.display = "none";
          msg.innerHTML = '❌ You are not at the allowed location.';
          return;
        }

        const formData = new URLSearchParams();
        formData.append('ID', id);
        formData.append('Status', status);
        formData.append('Location', `${lat},${lng}`);

        try {
          const res = await fetch(URL, { method: 'POST', body: formData });
          const data = await res.json();
          loading.style.display = "none";
          if (data.result === 'success') {
            msg.innerHTML = `✅ Hello ${data.name}! ${status} marked at ${data.time}`;
          } else if (data.result === 'already_done') {
            msg.innerHTML = `⚠️ ${status} already submitted today.`;
          } else {
            msg.innerHTML = `❌ ${data.message || 'Unknown Error'}`;
          }
        } catch {
          loading.style.display = "none";
          msg.innerHTML = "❌ Fetch error";
        }
      }, () => {
        loading.style.display = "none";
        msg.innerHTML = "❌ Location access failed.";
      });
    }

    async function filterByDate() {
      const id = document.getElementById("historyIdBox").value.trim();
      const dateInput = document.getElementById("dateInput").value;
      const msg = document.getElementById("historyMsg");
      const latestDateElement = document.getElementById("latestDate");

      if (!id) {
        msg.textContent = "❌ Please enter your ID.";
        msg.className = "status error";
        return;
      }

      msg.textContent = "⏳ Loading attendance data...";
      msg.className = "status info";

      try {
        const res = await fetch(`https://script.google.com/macros/s/AKfycbwYMb6IVNNSVO6E70ujDfO3x1x7G2sZX44X37MpTFiuBGysDNScXmsbZxuZUv-qJfXA/exec?id=${id}`);
        allData = await res.json();

        if (!allData || allData.length === 0) {
          msg.textContent = "⚠️ No Records Found for this ID.";
          document.getElementById("historyTable").style.display = "none";
          return;
        }

        allData.sort((a, b) => b.date.localeCompare(a.date));
        let filtered = allData;

        if (dateInput) {
          const selectedDate = dateInput.split("-").reverse().join("/");
          filtered = allData.filter(row => row.date === selectedDate);
          msg.textContent = filtered.length > 0
            ? `✅ ${filtered.length} Record(s) Found for ${selectedDate}.`
            : "⚠️ No Records found for the selected date.";
        } else {
          msg.textContent = `✅ ${allData.length} Record(s) loaded.`;
        }

        const table = document.getElementById("historyTable");
        const tbody = table.querySelector("tbody");
        table.style.display = "table";
        tbody.innerHTML = "";

        const latestDate = filtered.length > 0 ? filtered[0].date : null;
        const lastRow = allData[allData.length - 1];
        latestDateElement.innerHTML = `🗓️ Starting Attendance Date: <span style="color:#2193b0">${lastRow.date}</span>`;
        latestDateElement.style.display = "block";

        filtered.forEach(row => {
          const tr = document.createElement("tr");
          if (row.date === latestDate) tr.classList.add("highlight");
          const icon = row.status === "IN" ? "🟢" : "🔴";
          tr.innerHTML = `
            <td>${row.name}<br>${row.phone}</td>
            <td>${row.date}<br>${row.time}</td>
            <td>${row.location.replace(",", "<br>")}</td>
            <td>${icon} ${row.status}</td>
          `;
          tbody.appendChild(tr);
        });
      } catch (err) {
        msg.textContent = "❌ Error Loading data...";
      }
    }