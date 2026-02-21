(function () {
  const API = "http://localhost:3001/api";

  let currentUser = JSON.parse(localStorage.getItem("holly_user")) || null;
  let otpTarget   = {};
  let otpTimer    = null;

  document.body.insertAdjacentHTML("beforeend", `
  <div id="holly-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);z-index:9999;align-items:center;justify-content:center;">
    <div id="holly-modal" style="background:#fff;border-radius:20px;padding:40px 36px;width:min(440px,94vw);box-shadow:0 24px 64px rgba(0,0,0,.18);position:relative;font-family:'Segoe UI',sans-serif;animation:hollyPop .25s ease;">
      <button id="holly-close" style="position:absolute;top:16px;right:18px;background:none;border:none;font-size:22px;cursor:pointer;color:#999;">&#x2715;</button>

      <div id="holly-signin-form">
        <h2 class="holly-h2">Selamat Datang</h2>
        <p class="holly-sub">Masuk ke akun Holly Anda</p>
        <div class="holly-err" id="holly-err-1" style="display:none;"></div>
        <label class="holly-lbl">Email</label>
        <input id="holly-si-email" type="email" placeholder="email@contoh.com" class="holly-input" />
        <label class="holly-lbl">Kata Sandi</label>
        <div style="position:relative;">
          <input id="holly-si-pass" type="password" placeholder="••••••••" class="holly-input" />
          <button type="button" class="holly-eye" data-for="holly-si-pass">Lihat</button>
        </div>
        <button id="holly-si-btn" class="holly-btn">Masuk</button>
        <p class="holly-switch">Belum punya akun? <a href="#" id="go-signup" class="holly-link">Daftar</a></p>
      </div>

      <div id="holly-signup-form" style="display:none;">
        <h2 class="holly-h2">Buat Akun Baru</h2>
        <p class="holly-sub">Bergabung dengan Holly sekarang</p>
        <div class="holly-err" id="holly-err-2" style="display:none;"></div>
        <label class="holly-lbl">Nama Lengkap</label>
        <input id="holly-su-name" type="text" placeholder="Nama Anda" class="holly-input" />
        <label class="holly-lbl">Email</label>
        <input id="holly-su-email" type="email" placeholder="email@contoh.com" class="holly-input" />
        <label class="holly-lbl">Kata Sandi</label>
        <div style="position:relative;">
          <input id="holly-su-pass" type="password" placeholder="Min. 6 karakter" class="holly-input" />
          <button type="button" class="holly-eye" data-for="holly-su-pass">Lihat</button>
        </div>
        <button id="holly-su-btn" class="holly-btn">Kirim Kode OTP ke Email</button>
        <p class="holly-switch">Sudah punya akun? <a href="#" id="go-signin" class="holly-link">Masuk</a></p>
      </div>

      <div id="holly-otp-form" style="display:none;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:52px;">📧</div>
          <h2 class="holly-h2" style="margin-top:8px;">Cek Email Anda</h2>
          <p class="holly-sub">Kode OTP 6 digit dikirim ke<br><strong id="holly-otp-dest" style="color:#6c63ff;"></strong></p>
        </div>
        <div class="holly-err" id="holly-err-3" style="display:none;"></div>
        <div style="display:flex;gap:10px;justify-content:center;margin-bottom:24px;" id="holly-otp-boxes">
          <input type="text" maxlength="1" class="holly-otp-box" inputmode="numeric" />
          <input type="text" maxlength="1" class="holly-otp-box" inputmode="numeric" />
          <input type="text" maxlength="1" class="holly-otp-box" inputmode="numeric" />
          <input type="text" maxlength="1" class="holly-otp-box" inputmode="numeric" />
          <input type="text" maxlength="1" class="holly-otp-box" inputmode="numeric" />
          <input type="text" maxlength="1" class="holly-otp-box" inputmode="numeric" />
        </div>
        <button id="holly-otp-btn" class="holly-btn">Verifikasi &amp; Daftar</button>
        <div style="text-align:center;margin-top:16px;">
          <p style="margin:0 0 6px;color:#888;font-size:13px;">Tidak menerima email?</p>
          <button id="holly-resend" style="background:none;border:none;cursor:pointer;font-size:13px;font-family:'Segoe UI',sans-serif;color:#6c63ff;font-weight:600;">
            Kirim Ulang (<span id="holly-cd">60</span>s)
          </button>
        </div>
        <p style="text-align:center;margin:12px 0 0;">
          <a href="#" id="go-back" style="color:#6c63ff;font-weight:600;text-decoration:none;font-size:13px;">Kembali</a>
        </p>
      </div>
    </div>
  </div>

  <div id="holly-out-dialog" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);z-index:9999;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:20px;padding:36px;width:min(360px,90vw);text-align:center;font-family:'Segoe UI',sans-serif;animation:hollyPop .25s ease;">
      <div style="font-size:48px;margin-bottom:12px;">👋</div>
      <h3 style="margin:0 0 8px;font-size:20px;color:#1a1a2e;">Keluar dari Holly?</h3>
      <p id="holly-out-info" style="color:#888;font-size:14px;margin:0 0 28px;"></p>
      <div style="display:flex;gap:12px;">
        <button id="holly-out-cancel" style="flex:1;padding:12px;background:#f5f5f5;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;color:#555;">Batal</button>
        <button id="holly-out-confirm" style="flex:1;padding:12px;background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;">Keluar</button>
      </div>
    </div>
  </div>

  <div id="holly-toast" style="display:none;position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:13px 24px;border-radius:50px;font-size:14px;font-family:'Segoe UI',sans-serif;z-index:99999;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,.2);"></div>

  <style>
    @keyframes hollyPop{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .holly-h2{margin:0 0 6px;font-size:24px;color:#1a1a2e}
    .holly-sub{margin:0 0 24px;color:#888;font-size:14px}
    .holly-lbl{display:block;margin-bottom:6px;font-size:13px;color:#555;font-weight:600}
    .holly-input{width:100%;box-sizing:border-box;padding:12px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:14px;outline:none;transition:border .2s;margin-bottom:16px;font-family:'Segoe UI',sans-serif}
    .holly-input:focus{border-color:#6c63ff}
    .holly-btn{width:100%;padding:13px;background:linear-gradient(135deg,#6c63ff,#48cae4);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:8px;font-family:'Segoe UI',sans-serif;transition:opacity .2s}
    .holly-btn:hover{opacity:.88}
    .holly-btn:disabled{opacity:.5;cursor:not-allowed}
    .holly-link{color:#6c63ff;font-weight:600;text-decoration:none}
    .holly-link:hover{text-decoration:underline}
    .holly-err{background:#fff0f0;border:1px solid #ffb3b3;color:#c0392b;padding:10px 14px;border-radius:10px;margin-bottom:16px;font-size:13px}
    .holly-switch{text-align:center;margin:16px 0 0;font-size:13px;color:#888}
    .holly-eye{position:absolute;right:12px;top:50%;transform:translateY(-65%);background:none;border:none;cursor:pointer;color:#999;font-size:13px;font-family:'Segoe UI',sans-serif}
    .holly-otp-box{width:46px;height:56px;text-align:center;font-size:24px;font-weight:700;border:2px solid #e0e0e0;border-radius:12px;outline:none;transition:border .2s;color:#1a1a2e;font-family:'Segoe UI',sans-serif;box-sizing:border-box}
    .holly-otp-box:focus{border-color:#6c63ff;background:#f8f7ff}
    .holly-otp-box.ok{border-color:#48cae4}
    #holly-resend:disabled{color:#bbb;cursor:default}
  </style>
  `);

  const _ = id => document.getElementById(id);
  let toastT;

  function toast(msg, ms=3500){ const e=_("holly-toast"); e.textContent=msg; e.style.display="block"; clearTimeout(toastT); toastT=setTimeout(()=>e.style.display="none",ms); }
  function showErr(n,msg){ const e=_("holly-err-"+n); e.textContent=msg; e.style.display="block"; }
  function clrErr(n){ const e=_("holly-err-"+n); e.textContent=""; e.style.display="none"; }
  function setBtn(id,dis,lbl){ const b=_(id); b.disabled=dis; if(lbl) b.textContent=dis?"Memproses...":lbl; }
  function panel(name){ ["signin","signup","otp"].forEach(n=>_("holly-"+n+"-form").style.display=n===name?"block":"none"); }
  function openModal(p="signin"){ _("holly-overlay").style.display="flex"; [1,2,3].forEach(clrErr); panel(p); if(p!=="otp") stopCD(); }
  function closeModal(){ _("holly-overlay").style.display="none"; stopCD(); }

  const boxes = document.querySelectorAll(".holly-otp-box");
  boxes.forEach((b,i)=>{
    b.addEventListener("input",e=>{
      const v=e.target.value.replace(/\D/g,""); e.target.value=v;
      v?(e.target.classList.add("ok"),i<5&&boxes[i+1].focus()):e.target.classList.remove("ok");
    });
    b.addEventListener("keydown",e=>{ if(e.key==="Backspace"&&!b.value&&i>0){boxes[i-1].value="";boxes[i-1].classList.remove("ok");boxes[i-1].focus();} });
    b.addEventListener("paste",e=>{
      const p=(e.clipboardData||window.clipboardData).getData("text").replace(/\D/g,"");
      if(p.length===6){boxes.forEach((bx,j)=>{bx.value=p[j]||"";bx.classList.toggle("ok",!!p[j]);});boxes[5].focus();e.preventDefault();}
    });
  });
  function getOTP(){ return Array.from(boxes).map(b=>b.value).join(""); }
  function clrOTP(){ boxes.forEach(b=>{b.value="";b.classList.remove("ok");}); }

  function startCD(s=60){ const btn=_("holly-resend"),sp=_("holly-cd"); btn.disabled=true; sp.textContent=s; let r=s; otpTimer=setInterval(()=>{r--;sp.textContent=r;if(r<=0){clearInterval(otpTimer);btn.disabled=false;}},1000); }
  function stopCD(){ clearInterval(otpTimer); }

  document.querySelectorAll(".holly-eye").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const inp=_(btn.dataset.for);
      inp.type=inp.type==="password"?"text":"password";
      btn.textContent=inp.type==="password"?"Lihat":"Sembunyikan";
    });
  });

  async function post(path,body){
    const r=await fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    return r.json();
  }

  // SIGN IN
  _("holly-si-btn").addEventListener("click",async()=>{
    clrErr(1);
    const email=_("holly-si-email").value.trim(), pass=_("holly-si-pass").value;
    if(!email||!pass){showErr(1,"Email dan kata sandi harus diisi.");return;}
    setBtn("holly-si-btn",true,"Masuk");
    const users=JSON.parse(localStorage.getItem("holly_users")||"[]");
    const user=users.find(u=>u.email===email&&u.password===pass);
    setBtn("holly-si-btn",false,"Masuk");
    if(!user){showErr(1,"Email atau kata sandi salah.");return;}
    currentUser={name:user.name,email:user.email};
    localStorage.setItem("holly_user",JSON.stringify(currentUser));
    closeModal();updateNav();toast("Selamat datang, "+user.name+"!");
  });

  // SIGN UP - Kirim OTP
  _("holly-su-btn").addEventListener("click",async()=>{
    clrErr(2);
    const name=_("holly-su-name").value.trim(), email=_("holly-su-email").value.trim(), pass=_("holly-su-pass").value;
    if(!name||!email||!pass){showErr(2,"Semua kolom harus diisi.");return;}
    if(!/\S+@\S+\.\S+/.test(email)){showErr(2,"Format email tidak valid.");return;}
    if(pass.length<6){showErr(2,"Kata sandi minimal 6 karakter.");return;}
    const users=JSON.parse(localStorage.getItem("holly_users")||"[]");
    if(users.find(u=>u.email===email)){showErr(2,"Email sudah terdaftar. Silakan masuk.");return;}
    setBtn("holly-su-btn",true,"Kirim Kode OTP ke Email");
    try{
      // ✅ PERBAIKAN: name ikut dikirim ke backend
      const res=await post("/send-otp",{email, name});
      if(!res.success){showErr(2,res.message);setBtn("holly-su-btn",false,"Kirim Kode OTP ke Email");return;}
      otpTarget={name,email,password:pass};
      _("holly-otp-dest").textContent=email;
      clrOTP();clrErr(3);panel("otp");startCD(60);
      setTimeout(()=>boxes[0].focus(),100);
      toast("Kode OTP dikirim! Cek inbox atau folder spam.");
    }catch(e){
      showErr(2,"Gagal terhubung ke server. Pastikan backend berjalan.");
    }
    setBtn("holly-su-btn",false,"Kirim Kode OTP ke Email");
  });

  // VERIFY OTP & REGISTER
  _("holly-otp-btn").addEventListener("click",async()=>{
    clrErr(3);
    const otp=getOTP();
    if(otp.length<6){showErr(3,"Masukkan 6 digit kode OTP.");return;}
    setBtn("holly-otp-btn",true,"Verifikasi & Daftar");
    try{
      const v=await post("/verify-otp",{email:otpTarget.email,otp});
      if(!v.success){showErr(3,v.message);setBtn("holly-otp-btn",false,"Verifikasi & Daftar");return;}
      const users=JSON.parse(localStorage.getItem("holly_users")||"[]");
      users.push({name:otpTarget.name,email:otpTarget.email,password:otpTarget.password});
      localStorage.setItem("holly_users",JSON.stringify(users));
      currentUser={name:otpTarget.name,email:otpTarget.email};
      localStorage.setItem("holly_user",JSON.stringify(currentUser));
      otpTarget={};closeModal();updateNav();
      toast("Akun berhasil dibuat! Selamat datang, "+currentUser.name+"!");
    }catch(e){
      showErr(3,"Gagal terhubung ke server. Pastikan backend berjalan.");
    }
    setBtn("holly-otp-btn",false,"Verifikasi & Daftar");
  });

  // RESEND OTP
  _("holly-resend").addEventListener("click",async()=>{
    clrErr(3);
    try{
      // ✅ PERBAIKAN: name ikut dikirim saat resend
      const res=await post("/send-otp",{email:otpTarget.email, name:otpTarget.name});
      if(!res.success){showErr(3,res.message);return;}
      clrOTP();boxes[0].focus();startCD(60);toast("OTP baru telah dikirim!");
    }catch(e){
      showErr(3,"Gagal terhubung ke server.");
    }
  });

  // SIGN OUT
  _("holly-out-confirm").addEventListener("click",()=>{
    currentUser=null;
    localStorage.removeItem("holly_user");
    _("holly-out-dialog").style.display="none";
    updateNav();
    toast("Anda berhasil keluar.");
  });
  _("holly-out-cancel").addEventListener("click",()=>_("holly-out-dialog").style.display="none");
  _("holly-out-dialog").addEventListener("click",e=>{if(e.target===_("holly-out-dialog"))_("holly-out-dialog").style.display="none";});

  // NAVIGASI
  _("go-signup").addEventListener("click",e=>{e.preventDefault();openModal("signup");});
  _("go-signin").addEventListener("click",e=>{e.preventDefault();openModal("signin");});
  _("go-back").addEventListener("click",e=>{e.preventDefault();stopCD();panel("signup");});
  _("holly-close").addEventListener("click",closeModal);
  _("holly-overlay").addEventListener("click",e=>{if(e.target===_("holly-overlay"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();_("holly-out-dialog").style.display="none";}});

  // UPDATE NAV
  function updateNav(){
    const si=document.querySelector(".text-wrapper"), su=document.querySelector(".text-wrapper-3");
    if(!si)return;
    if(currentUser){
      si.textContent=currentUser.name.split(" ")[0];
      si.style.cursor="default";
      si.style.fontWeight="700";
      si.onclick=null;
      if(su){
        su.textContent="Sign Out";
        su.style.cursor="pointer";
        su.onclick=()=>{
          _("holly-out-info").textContent="Masuk sebagai "+currentUser.email;
          _("holly-out-dialog").style.display="flex";
        };
      }
    }else{
      si.textContent="Sign In";
      si.style.cursor="pointer";
      si.style.fontWeight="";
      si.onclick=()=>openModal("signin");
      if(su){
        su.textContent="Sign Up";
        su.style.cursor="pointer";
        su.onclick=()=>openModal("signup");
      }
    }
  }

  // INIT
  const siNav=document.querySelector(".text-wrapper");
  if(siNav&&siNav.textContent.trim()==="Sign In"){
    siNav.style.cursor="pointer";
    siNav.addEventListener("click",()=>openModal("signin"));
  }
  const suNav=document.querySelector(".text-wrapper-3");
  if(suNav&&suNav.textContent.trim()==="Sign Up"){
    suNav.style.cursor="pointer";
    suNav.addEventListener("click",()=>openModal("signup"));
  }
  updateNav();
})();