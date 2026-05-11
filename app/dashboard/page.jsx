"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

// Firebase Imports (আপনার lib/firebase.js অনুযায়ী)
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase"; 
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // States
  const [profileData, setProfileData] = useState({
    name: "",
    avatarSeed: "TaskBazarUser",
    points: 0,
    todayPoints: 0,
    completedTasks: 0,
  });
  const [notice, setNotice] = useState("লোড হচ্ছে...");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [notifModal, setNotifModal] = useState(false);
  const [loginRequest, setLoginRequest] = useState({
    show: false,
    correctCode: "",
  });
  const [enteredCode, setEnteredCode] = useState("");
  const [toastMsg, setToastMsg] = useState(null);

  // Helper Functions
  const convertToBanglaNumber = (num) => {
    const banglaDigits = {
      0: "০", 1: "১", 2: "২", 3: "৩", 4: "৪",
      5: "৫", 6: "৬", 7: "৭", 8: "৮", 9: "৯",
    };
    return String(num).replace(/[0-9]/g, (x) => banglaDigits[x]);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Firebase Effects
  useEffect(() => {
    // If no user, redirect to login
    if (user === null) {
      router.push("/login");
      return;
    }

    if (user) {
      // 1. Fetch Notice
      const noticeRef = ref(db, `settings/notice`);
      const unsubNotice = onValue(noticeRef, (snapshot) => {
        if (snapshot.exists()) {
          setNotice(snapshot.val());
        } else {
          setNotice("টাস্কবাজারে আপনাকে স্বাগতম! প্রতিদিনের কাজ সম্পন্ন করে পয়েন্ট অর্জন করুন।");
        }
      });

      // 2. Fetch Tasks (Limit 2)
      const tasksRef = ref(db, "tasks");
      const unsubTasks = onValue(tasksRef, (snapshot) => {
        if (snapshot.exists()) {
          const tasksArray = [];
          let count = 0;
          snapshot.forEach((childSnapshot) => {
            if (count >= 2) return;
            tasksArray.push({ id: childSnapshot.key, ...childSnapshot.val() });
            count++;
          });
          setTasks(tasksArray);
        }
      });

      // 3. Fetch User Profile
      const userProfileRef = ref(db, `users/${user.uid}/profile`);
      const unsubProfile = onValue(userProfileRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfileData({
            name: data.name || user.email.split("@")[0],
            avatarSeed: data.avatarSeed || "TaskBazarUser",
            points: data.points || 0,
            todayPoints: data.todayPoints || 0,
            completedTasks: data.completedTasks || 0,
          });
        }
        setLoading(false);
      });

      // 4. App Login Verification Request
      const loginReqRef = ref(db, `app_login_requests/${user.uid}`);
      const unsubLoginReq = onValue(loginReqRef, (snapshot) => {
        if (snapshot.exists() && snapshot.val().status === "pending") {
          setLoginRequest({
            show: true,
            correctCode: snapshot.val().code,
          });
        } else {
          setLoginRequest({ show: false, correctCode: "" });
        }
      });

      return () => {
        unsubNotice();
        unsubTasks();
        unsubProfile();
        unsubLoginReq();
      };
    }
  }, [user, router]);

  // Handlers
  const handleVerifyCode = () => {
    if (enteredCode === loginRequest.correctCode) {
      update(ref(db, `app_login_requests/${user.uid}`), { status: "verified" });
      showToast("সফলভাবে ভেরিফাই হয়েছে! অ্যাপটি অটোমেটিক চালু হবে।");
      setLoginRequest({ show: false, correctCode: "" });
      setEnteredCode("");
    } else {
      showToast("ভুল কোড দিয়েছেন! আবার চেষ্টা করুন।");
    }
  };

  // UI rendering
  if (loading || !user) {
    return (
      <div className="fixed inset-0 bg-[radial-gradient(circle,#0d6d5a_0%,#052c24_100%)] flex justify-center items-center z-[9999]">
        <div className="text-center">
          <div className="w-[60px] h-[60px] border-4 border-white/10 border-l-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-[22px] tracking-[2px] font-bold animate-pulse">
            TaskBazar
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f7f6] min-h-screen pt-[75px] pb-[85px] font-sans">
      <style>{`
        .fade-up { animation: fadeUp 0.5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-red { animation: pulseRed 2s infinite; }
        @keyframes pulseRed { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); } }
      `}</style>

      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 w-full h-[70px] bg-white border-b border-[#f1f1f1] flex items-center justify-between px-5 z-[1000] shadow-sm max-w-[500px] mx-auto right-0">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder - Update src to your actual logo */}
          <div className="w-[40px] h-[40px] bg-[#1ab394] rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg">
            T
          </div>
          <span className="text-[22px] font-extrabold text-[#0d6d5a] tracking-tight mt-[2px]">
            TaskBazar
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden">{profileData.name}</span>
          <Link href="/profile">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.avatarSeed}`}
              alt="User"
              className="w-[42px] h-[42px] rounded-full border-2 border-[#1ab394] object-cover cursor-pointer active:scale-90 transition-transform"
            />
          </Link>
          <button
            onClick={() => setNotifModal(true)}
            className="relative w-[40px] h-[40px] rounded-xl bg-[#f8fafa] text-[#444] flex items-center justify-center text-[18px] border border-[#eee] active:scale-90 transition-transform"
          >
            <i className="fas fa-bell"></i>
            <div className="absolute top-[-3px] right-[-3px] w-[14px] h-[14px] bg-red-500 border-2 border-white rounded-full pulse-red"></div>
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-[500px] mx-auto px-[15px]">
        {/* Notice Board */}
        <div className="fade-up bg-[#ebf8f4] border border-[#c6f0e4] text-[#0d6d5a] p-[10px_15px] rounded-xl flex items-center gap-[10px] text-[12px] font-bold mb-[15px]">
          <i className="fas fa-bullhorn animate-bounce"></i>
          <marquee behavior="scroll" direction="left" scrollAmount="4">
            {notice}
          </marquee>
        </div>

        {/* Dashboard Banner */}
        <div
          className="fade-up dashboard-banner bg-gradient-to-br from-[#1ab394] to-[#0d6d5a] rounded-[20px] p-[25px_20px] text-white mb-5 shadow-[0_10px_30px_rgba(26,179,148,0.3)] relative overflow-hidden"
          style={{ animationDelay: "0.1s" }}
        >
          <i className="fas fa-star absolute right-[-15px] bottom-[-20px] text-[110px] opacity-10 -rotate-[15deg]"></i>
          <div className="flex justify-between items-start mb-[15px] relative z-10">
            <div>
              <span className="text-[12px] font-semibold opacity-90 block mb-[5px]">
                আপনার মোট পয়েন্ট
              </span>
              <h2 className="text-[32px] font-extrabold m-0 leading-none tracking-tight">
                {convertToBanglaNumber(profileData.points)}{" "}
                <span className="text-[16px] font-semibold">পয়েন্ট</span>
              </h2>
            </div>
            <Link
              href="/task"
              className="bg-white/20 px-3 py-2 rounded-xl text-[11px] font-bold text-white backdrop-blur-sm shadow-sm"
            >
              <i className="fas fa-bolt mr-1"></i> পয়েন্ট অর্জন
            </Link>
          </div>
          <div className="flex gap-[15px] border-t border-white/15 pt-[15px] relative z-10">
            <div className="flex-1">
              <span className="block text-[10px] opacity-80 font-semibold uppercase">
                আজকের অর্জন
              </span>
              <h4 className="m-[3px_0_0_0] text-[15px] font-extrabold">
                {convertToBanglaNumber(profileData.todayPoints)} পয়েন্ট
              </h4>
            </div>
            <div className="flex-1 border-l border-white/20 pl-4">
              <span className="block text-[10px] opacity-80 font-semibold uppercase">
                মোট টাস্ক সম্পন্ন
              </span>
              <h4 className="m-[3px_0_0_0] text-[15px] font-extrabold flex items-center gap-1">
                {convertToBanglaNumber(profileData.completedTasks)} টি{" "}
                <i className="fas fa-check-circle text-[10px] text-white/80"></i>
              </h4>
            </div>
          </div>
        </div>

        {/* Quick Grid */}
        <div
          className="fade-up grid grid-cols-4 gap-[10px] mb-[25px]"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            href="/task"
            className="bg-white p-[15px_5px] rounded-2xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/5 text-[#444] active:scale-95 transition-transform"
          >
            <div className="w-[42px] h-[42px] mx-auto mb-[8px] rounded-xl flex items-center justify-center text-[18px] text-white bg-gradient-to-br from-blue-500 to-blue-600">
              <i className="fas fa-briefcase"></i>
            </div>
            <span className="text-[11px] font-extrabold">কাজ</span>
          </Link>
          <Link
            href="/profile"
            className="bg-white p-[15px_5px] rounded-2xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/5 text-[#444] active:scale-95 transition-transform"
          >
            <div className="w-[42px] h-[42px] mx-auto mb-[8px] rounded-xl flex items-center justify-center text-[18px] text-white bg-gradient-to-br from-[#10b981] to-[#047857]">
              <i className="fas fa-user"></i>
            </div>
            <span className="text-[11px] font-extrabold">প্রোফাইল</span>
          </Link>
          <Link
            href="/refer"
            className="bg-white p-[15px_5px] rounded-2xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/5 text-[#444] active:scale-95 transition-transform"
          >
            <div className="w-[42px] h-[42px] mx-auto mb-[8px] rounded-xl flex items-center justify-center text-[18px] text-white bg-gradient-to-br from-amber-500 to-amber-600">
              <i className="fas fa-user-plus"></i>
            </div>
            <span className="text-[11px] font-extrabold">রেফার</span>
          </Link>
          <Link
            href="/order"
            className="bg-white p-[15px_5px] rounded-2xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/5 text-[#444] active:scale-95 transition-transform"
          >
            <div className="w-[42px] h-[42px] mx-auto mb-[8px] rounded-xl flex items-center justify-center text-[18px] text-white bg-gradient-to-br from-purple-500 to-purple-700">
              <i className="fas fa-clock-rotate-left"></i>
            </div>
            <span className="text-[11px] font-extrabold">হিস্ট্রি</span>
          </Link>
        </div>

        {/* Section Header */}
        <div
          className="fade-up flex justify-between items-center mb-[12px]"
          style={{ animationDelay: "0.3s" }}
        >
          <h3 className="text-[15px] font-extrabold text-[#2d3748] m-0">
            চলমান কাজসমূহ
          </h3>
          <Link
            href="/task"
            className="text-[11px] font-bold text-[#1ab394]"
          >
            সব দেখুন <i className="fas fa-arrow-right ml-1"></i>
          </Link>
        </div>

        {/* Task List */}
        <div className="fade-up flex flex-col gap-[12px]" style={{ animationDelay: "0.4s" }}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <Link
                key={task.id}
                href="/task"
                className="bg-white rounded-2xl p-[12px] shadow-[0_4px_18px_rgba(0,0,0,0.06)] border-[1.5px] border-[#1ab394]/5 flex items-center gap-[12px] active:scale-95 transition-transform"
              >
                <div
                  className={`w-[45px] h-[45px] rounded-xl shrink-0 flex items-center justify-center text-[20px] ${
                    task.platform === "youtube"
                      ? "bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <i
                    className={`fab ${
                      task.platform === "youtube" ? "fa-youtube" : "fa-facebook-f"
                    }`}
                  ></i>
                </div>
                <div className="grow">
                  <div className="text-[12px] font-extrabold text-[#333] leading-snug mb-1">
                    {task.title}
                  </div>
                  <div className="text-[11px] font-extrabold text-[#1ab394]">
                    <i className="fas fa-star text-yellow-500 mr-1"></i>{" "}
                    {convertToBanglaNumber(task.points)} পয়েন্ট
                  </div>
                </div>
                <div className="bg-slate-100 text-slate-600 w-[32px] h-[32px] rounded-xl flex items-center justify-center text-[12px]">
                  <i className="fas fa-play"></i>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-[#777] text-[12px] my-3">
              বর্তমানে কোনো কাজ নেই।
            </p>
          )}
        </div>

        <div className="h-[30px]"></div>
      </main>

      {/* ─── Bottom Footer Navigation ─── */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-[500px] mx-auto w-full bg-white border-t border-[#f1f1f1] h-[70px] flex items-center z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
        <div className="flex w-full justify-around items-center px-2">
          <Link
            href="/help"
            className={`text-[11px] font-bold text-center flex-1 uppercase transition-colors ${
              pathname === "/help" ? "text-[#1ab394]" : "text-[#9ca3af]"
            }`}
          >
            <i className="fas fa-headset text-[20px] block mb-1"></i>হেল্প
          </Link>
          <Link
            href="/order"
            className={`text-[11px] font-bold text-center flex-1 uppercase transition-colors ${
              pathname === "/order" ? "text-[#1ab394]" : "text-[#9ca3af]"
            }`}
          >
            <i className="fas fa-cart-plus text-[20px] block mb-1"></i>অর্ডার
          </Link>
          <Link
            href="/dashboard"
            className="w-[55px] h-[55px] bg-[#0d6d5a] rounded-[18px] -mt-[35px] border-[5px] border-[#f4f7f6] flex items-center justify-center text-white shadow-[0_8px_15px_rgba(13,109,90,0.4)] active:scale-90 transition-transform"
          >
            <i className="fas fa-house-chimney text-2xl"></i>
          </Link>
          <Link
            href="/task"
            className={`text-[11px] font-bold text-center flex-1 uppercase transition-colors ${
              pathname === "/task" ? "text-[#1ab394]" : "text-[#9ca3af]"
            }`}
          >
            <i className="fas fa-briefcase text-[20px] block mb-1"></i>কাজ
          </Link>
          <Link
            href="/profile"
            className={`text-[11px] font-bold text-center flex-1 uppercase transition-colors ${
              pathname === "/profile" ? "text-[#1ab394]" : "text-[#9ca3af]"
            }`}
          >
            <i className="fas fa-circle-user text-[20px] block mb-1"></i>প্রোফাইল
          </Link>
        </div>
      </footer>

      {/* ─── Custom Modals ─── */}

      {/* Notification Modal */}
      {notifModal && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center px-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[320px] text-center shadow-2xl animate-[fadeUp_0.3s_ease]">
            <div className="w-[60px] h-[60px] bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fas fa-bell"></i>
            </div>
            <h3 className="text-[18px] font-extrabold text-gray-800 mb-2">
              নোটিফিকেশন
            </h3>
            <p className="text-[14px] text-gray-600 mb-6">
              আপনার জন্য এই মুহূর্তে কোনো নতুন নোটিফিকেশন নেই!
            </p>
            <button
              onClick={() => setNotifModal(false)}
              className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl active:scale-95 transition-transform"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* App Login Request Prompt Modal */}
      {loginRequest.show && (
        <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center px-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[350px] text-center shadow-2xl animate-[fadeUp_0.3s_ease]">
            <div className="w-[60px] h-[60px] bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fas fa-shield-halved"></i>
            </div>
            <h3 className="text-[18px] font-extrabold text-gray-800 mb-2">
              লগইন ভেরিফিকেশন
            </h3>
            <p className="text-[13px] text-gray-600 mb-4 font-semibold leading-relaxed">
              আপনার অ্যাকাউন্ট দিয়ে অ্যাপে লগইনের চেষ্টা করা হচ্ছে! <br />
              দয়া করে অ্যাপের স্ক্রিনে দেখানো ৪ ডিজিটের কোডটি এখানে লিখুন:
            </p>
            <input
              type="number"
              placeholder="কোড লিখুন"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              className="w-full text-center text-[20px] tracking-widest font-bold py-3 border-2 border-gray-200 rounded-xl focus:border-[#1ab394] outline-none mb-4"
            />
            <button
              onClick={handleVerifyCode}
              className="w-full bg-gradient-to-r from-[#1ab394] to-[#0d6d5a] text-white font-bold py-3 rounded-xl active:scale-95 transition-transform shadow-lg"
            >
              ভেরিফাই করুন
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[3000] bg-white border-l-4 border-[#1ab394] text-gray-800 shadow-[0_5px_15px_rgba(0,0,0,0.1)] px-4 py-3 rounded-lg flex items-center gap-3 w-[90%] max-w-[350px] animate-[fadeUp_0.3s_ease]">
          <i className="fas fa-info-circle text-[#1ab394] text-xl"></i>
          <span className="text-[13px] font-bold leading-tight">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
