
// === Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyAlpYiV5p90QGUZL2oPD5vR65YlWMo62L0",
  authDomain: "chatonline-96b8c.firebaseapp.com",
  projectId: "chatonline-96b8c",
  storageBucket: "chatonline-96b8c.appspot.com", // sửa ".firebasestorage.app" thành ".appspot.com"
  messagingSenderId: "713765450768",
  appId: "1:713765450768:web:cf029b5a7a16e5ad7a0695",
  measurementId: "G-ME171J2SWM",
  databaseURL: "https://chatonline-96b8c-default-rtdb.asia-southeast1.firebasedatabase.app"// thêm dòng này để dùng Realtime DB
};

// === Khởi tạo Firebase ===
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const rtdb = firebase.database();
const auth = firebase.auth();

let userId = null;
let presenceRef = null;
let presenceRoot = rtdb.ref("presence");

// Đăng nhập ẩn danh
auth.signInAnonymously().then(() => {
  userId = "user_" + Math.random().toString(36).substr(2, 9);
  handlePresence(userId);
  listenMessages();
});

window.sendMessage = function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (text === "") return;

  db.collection("chats").add({
    message: text,
    sender: userId,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
};


// Lắng nghe tin nhắn
function listenMessages() {
  const msgBox = document.getElementById("messages");
  db.collection("chats").orderBy("timestamp")
    .onSnapshot(snapshot => {
      msgBox.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        const el = document.createElement("div");
        el.className = "msg";
        el.textContent = (data.sender === userId ? "You" : "Friend") + ": " + data.message;
        msgBox.appendChild(el);
        msgBox.scrollTop = msgBox.scrollHeight;
      });
    });
}

// Quản lý số người online
function handlePresence(userId) {
  presenceRef = rtdb.ref("presence/" + userId);

  firebase.database().ref(".info/connected").on("value", function (snap) {
    if (snap.val() === true) {
      console.log("connected");
      presenceRef.set(true);
      presenceRef.onDisconnect().remove();
    }
  });

  presenceRoot.on("value", (snapshot) => {
    const users = snapshot.val();
    const onlineCount = users ? Object.keys(users).length : 0;

    document.getElementById("online").textContent = `${onlineCount}/2 người đang online`;

    if (onlineCount > 2) {
      alert("Trang web chỉ cho phép tối đa 2 người cùng truy cập.");
      document.body.innerHTML = "<h2>Đã đủ người tham gia!</h2>";
      if (presenceRef) presenceRef.remove();
    }
  });
}
