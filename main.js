// === Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyAlpYiV5p90QGUZL2oPD5vR65YlWMo62L0",
  authDomain: "chatonline-96b8c.firebaseapp.com",
  projectId: "chatonline-96b8c",
  storageBucket: "chatonline-96b8c.appspot.com",
  messagingSenderId: "713765450768",
  appId: "1:713765450768:web:cf029b5a7a16e5ad7a0695",
  measurementId: "G-ME171J2SWM",
  databaseURL: "https://chatonline-96b8c-default-rtdb.asia-southeast1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const rtdb = firebase.database();
const auth = firebase.auth();

let userId = null;
let presenceRef = null;
let displayName = "";
let presenceRoot = rtdb.ref("presence");

window.sendMessage = function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (text === "") return;

  db.collection("chats").add({
    message: text,
    senderId: userId,
    senderName: displayName,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
};

function listenMessages() {
  const msgBox = document.getElementById("messages");
  db.collection("chats").orderBy("timestamp")
    .onSnapshot(snapshot => {
      msgBox.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        const isMe = data.senderId === userId;
        const senderLabel = isMe ? "Bạn" : data.senderName || "Ẩn danh";

        const el = document.createElement("div");
        el.className = "msg " + (isMe ? "me" : "other");
        el.innerHTML = `<div class="sender">${senderLabel}</div>${data.message}`;
        msgBox.appendChild(el);
        msgBox.scrollTop = msgBox.scrollHeight;
      });
    });
}

function handlePresence(userId) {
  presenceRef = rtdb.ref("presence/" + userId);
  firebase.database().ref(".info/connected").on("value", (snap) => {
    if (snap.val() === true) {
      presenceRef.set({ online: true, last_seen: Date.now() });
      presenceRef.onDisconnect().remove();
      setInterval(() => {
        presenceRef.update({ last_seen: Date.now() });
      }, 5000);
    }
  });

  presenceRoot.on("value", (snapshot) => {
    const users = snapshot.val();
    const now = Date.now();
    let onlineCount = 0;

    if (users) {
      Object.values(users).forEach(user => {
        if (user.last_seen && (now - user.last_seen < 10000)) {
          onlineCount++;
        }
      });
    }

    document.getElementById("online").textContent = `${onlineCount}/10 người đang online`;

    if (onlineCount > 10) {
      alert("Trang web chỉ cho phép tối đa 10 người cùng truy cập.");
      document.body.innerHTML = "<h2>Đã đủ người tham gia!</h2>";
      if (presenceRef) presenceRef.remove();
    }
  });
}

window.startChat = function () {
  const nameInput = document.getElementById("usernameInput");
  const name = nameInput.value.trim();
  if (name === "") {
    alert("Bạn phải nhập tên trước khi chat.");
    return;
  }

  displayName = name;
  document.getElementById("usernameSection").style.display = "none";
  document.getElementById("chatContainer").style.display = "flex";

  auth.signInAnonymously().then(() => {
    userId = "user_" + Math.random().toString(36).substr(2, 9);
    handlePresence(userId);
    listenMessages();
  });
};

// Gửi bằng phím Enter
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && document.getElementById("chatContainer").style.display === "flex") {
    sendMessage();
  }
});
