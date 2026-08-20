(()=>{
  const page=document.getElementById('page-home');
  if(!page||page.dataset.homeV1==='1')return;
  page.dataset.homeV1='1';

  const oldHello=document.getElementById('hello')?.textContent||'こんにちは';
  const oldMain=document.getElementById('heroMessage')?.textContent||'続けるほど、身体は変わる。';
  const oldSub=document.getElementById('heroSub')?.textContent||'';

  page.className='page active px-5 pt-5 pb-8 space-y-5';
  page.innerHTML=`
    <div id="hero" class="hero rounded-[26px] p-6 text-white">
      <div id="hello" class="text-[11px] text-white/60 font-bold"></div>
      <h1 id="heroMessage" class="hero-message mt-2"></h1>
      <p id="heroSub" class="hero-sub hidden"></p>
    </div>

    <div id="personalSection" class="hidden">
      <div class="section-label">MESSAGE FOR YOU</div>
      <h2 class="section-title">あなたへのメッセージ</h2>
      <div id="personalList" class="space-y-3 mt-3"></div>
    </div>

    <div id="noticeSection" class="hidden">
      <div class="flex items-end justify-between mb-3">
        <div>
          <div class="section-label">INFORMATION</div>
          <h2 class="section-title">お知らせ</h2>
        </div>
        <span id="noticeCount" class="text-[10px] font-black text-orange-600"></span>
      </div>
      <div id="homeNotices" class="space-y-2"></div>
    </div>

    <div>
      <div class="flex items-end justify-between mb-3">
        <div>
          <div class="section-label">NEXT EVENT</div>
          <h2 class="section-title">次回の開催</h2>
        </div>
        <button onclick="showPage('events')" class="text-[11px] font-bold text-slate-400">イベントを見る</button>
      </div>
      <article id="homeNextEvent" class="card overflow-hidden">
        <div class="p-5">
          <div class="text-xs text-slate-400">次回イベントを確認しています…</div>
        </div>
      </article>
    </div>

    <div>
      <div class="section-label">ACTION</div>
      <h2 class="section-title">ちょっと、やってみる。</h2>
      <div class="card p-5 mt-3 border-orange-100 bg-orange-50/30">
        <div class="flex gap-3 items-start">
          <div class="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 grid place-items-center shrink-0">
            <i data-lucide="footprints" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="text-[15px] font-black leading-6">今日は、いつもより5分だけ歩いてみる。</div>
            <p class="text-[11px] leading-5 text-slate-500 mt-2">移動や買い物のついでで十分です。できるところから少しだけ。</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-orange-100 text-[10px] text-slate-400">まずは表示イメージです。記録機能は次の段階で追加します。</div>
      </div>
    </div>`;

  document.getElementById('hello').textContent=oldHello;
  document.getElementById('heroMessage').textContent=oldMain;
  if(oldSub){
    const sub=document.getElementById('heroSub');
    sub.textContent=oldSub;
    sub.classList.remove('hidden');
  }

  async function refreshHero(){
    try{
      const {data:s}=await sb.from('bizfit_settings').select('*').eq('id','main').single();
      if(!s)return;
      const hero=document.getElementById('hero');
      hero.classList.toggle('hidden',!s.hero_visible);
      const main=document.getElementById('heroMessage');
      main.textContent=s.hero_message||'続けるほど、身体は変わる。';
      main.style.fontSize=(s.hero_message_size||25)+'px';
      const sub=document.getElementById('heroSub');
      if(s.hero_submessage){
        sub.textContent=s.hero_submessage;
        sub.style.fontSize=(s.hero_submessage_size||12)+'px';
        sub.classList.remove('hidden');
      }else{
        sub.textContent='';
        sub.classList.add('hidden');
      }
    }catch(e){}
  }

  async function loadHomeNextEvent(){
    const box=document.getElementById('homeNextEvent');
    if(!box)return;
    try{
      const today=new Date().toISOString().slice(0,10);
      const {data,error}=await sb.from('bizfit_events').select('id,title,event_date,start_time,venue,description,image_url,category').eq('status','scheduled').gte('event_date',today).order('event_date',{ascending:true}).limit(1);
      if(error)throw error;
      const e=data?.[0];
      if(!e){
        box.innerHTML='<div class="p-5"><div class="text-sm font-black">現在、公開中の予定はありません。</div><p class="text-[11px] text-slate-400 mt-2">次回の開催が決まり次第、ここに表示します。</p></div>';
        return;
      }
      box.innerHTML='';
      if(e.image_url){
        const img=document.createElement('img');
        img.src=e.image_url;img.alt='';img.className='w-full h-32 object-cover';
        box.appendChild(img);
      }
      const body=document.createElement('div');body.className='p-5';
      const date=document.createElement('div');date.className='text-[10px] font-black accent';date.textContent=e.event_date.replace(/-/g,'.')+(e.start_time?'  '+e.start_time.slice(0,5):'');
      const title=document.createElement('div');title.className='text-[16px] font-black mt-1';title.textContent=e.title;
      const place=document.createElement('div');place.className='text-[11px] text-slate-400 mt-2';place.textContent=e.venue||'会場は詳細をご確認ください';
      const btn=document.createElement('button');btn.className='mt-4 w-full py-3 rounded-2xl bg-orange-50 text-orange-600 text-xs font-black';btn.textContent='詳しく見る';btn.onclick=()=>showPage('events');
      body.append(date,title,place,btn);box.appendChild(body);
    }catch(e){
      box.innerHTML='<div class="p-5"><div class="text-xs text-slate-400">次回イベントを読み込めませんでした。</div></div>';
    }
  }

  const wait=setInterval(async()=>{
    try{
      if(typeof personId!=='undefined'&&personId){
        clearInterval(wait);
        await refreshHero();
        if(typeof loadPersonal==='function')await loadPersonal();
        if(typeof loadNotices==='function')await loadNotices();
        await loadHomeNextEvent();
        if(window.lucide)lucide.createIcons();
      }
    }catch(e){}
  },200);
  setTimeout(()=>clearInterval(wait),10000);
})();