let currentsection = 'landing';
let currentchallenge = null;
let searchchallenge = null;
let detailchallenge = null;
let localchallenges = null;
let previoussection = 'filtersection';

const BASE = 'https://programming-challenges.p.rapidapi.com';
const hdrs = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };


function settheme(t) {
  document.body.classList.toggle('lightmode', t === 'Let there be lyte ;)');
  localStorage.setItem('theme', t);
  const btn = document.getElementById('themebutnid');
  if (btn) btn.textContent = t === 'Let there be lyte ;)' ? 'Let it be dark' : 'Let there be lyte ;)';
}

function inittheme() {
  settheme(localStorage.getItem('theme') || 'Let it be dark');
}

function toggletheme() {
  settheme(localStorage.getItem('theme') === 'Let there be lyte ;)' ? 'Let it be dark' : 'Let there be lyte ;)');
}


function showsection(id) {
  document.querySelectorAll('.appsection').forEach(s => s.classList.add('sectionhidden'));
  const target = document.getElementById(id);
  if (target) target.classList.remove('sectionhidden');

  document.querySelectorAll('.navlinkitem').forEach(l => l.classList.remove('activenav'));
  const activelink = document.querySelector(`.navlinkitem[data-section="${id}"]`);
  if (activelink) activelink.classList.add('activenav');

  if (id === 'landing') {
    document.getElementById('navwrapid').classList.add('sectionhidden');
  } else {
    document.getElementById('navwrapid').classList.remove('sectionhidden');
  }

  localStorage.setItem('lastsection', id);
  currentsection = id;
}

function getstarted() {
  showsection('dashboard');
}


async function loadlocalchallenges() {
  if (localchallenges) return localchallenges;
  try {
    const r = await fetch('challenges.json');
    if (!r.ok) return null;
    localchallenges = await r.json();
    return localchallenges;
  } catch(e) {
    return null;
  }
}

async function apifetch(endpoint) {
  const r = await fetch(BASE + endpoint, { headers: hdrs });
  if (!r.ok) throw new Error('api ' + r.status);
  return r.json();
}

async function apifetchWithFallback(endpoint, fallbackfn) {
  try {
    return await apifetch(endpoint);
  } catch(e) {
    const local = await loadlocalchallenges();
    if (!local) throw e;
    return fallbackfn(local);
  }
}


function eschtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function badgeclass(diff) {
  if (!diff) return '';
  const d = diff.toLowerCase();
  if (d === 'beginner') return 'diffbeginner';
  if (d === 'intermediate') return 'diffintermediate';
  return 'diffexpert';
}

function getsolutions(data) {
  const raw = data.solution;
  return Array.isArray(raw) ? raw[0] : (raw || {});
}

function rendertestcases(tcwrap, testCases) {
  tcwrap.innerHTML = '';
  (testCases || []).forEach(t => {
    const box = document.createElement('div');
    box.className = 'testcasebox';
    box.innerHTML = `input: <span>${eschtml(t.input)}</span> &nbsp; output: <span>${eschtml(t.output)}</span>`;
    tcwrap.appendChild(box);
  });
}

function spawnconfetti() {
  const colors = ['#4a8ef5', '#3fb950', '#d4a020', '#a78bfa', '#f97316'];
  const wrap = document.createElement('div');
  wrap.className = 'confettiwrap';
  document.body.appendChild(wrap);

  for (let i = 0; i < 120; i++) {
    const piece = document.createElement('div');
    piece.className = 'confettipiece';
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      animation-delay: ${Math.random() * 0.8}s;
      animation-duration: ${1.8 + Math.random() * 1.4}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      opacity: ${0.7 + Math.random() * 0.3};
    `;
    wrap.appendChild(piece);
  }

  setTimeout(() => wrap.remove(), 4000);
}


function fillchallenge(data) {
  if (!data || data.error) {
    document.getElementById('challengetitleid').textContent = '';
    document.getElementById('challengedescid').textContent = 'Could not load. Check your API key. You probably exhausted your quota XD';
    return;
  }
  currentchallenge = data;
  localStorage.setItem('lastchallengeid', data.id);

  document.getElementById('challengetitleid').textContent = data.Challenge || '';
  const badge = document.getElementById('challengebadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);
  document.getElementById('challengedescid').textContent = data.description || '';

  rendertestcases(document.getElementById('testcaseswrapid'), data.testCases);

  const solutions = getsolutions(data);
  const sel = document.getElementById('selectlgeid');
  sel.innerHTML = '';
  Object.keys(solutions).forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.textContent = l;
    sel.appendChild(opt);
  });

  document.getElementById('trybtnid').classList.remove('sectionhidden');
  document.getElementById('editorwrapid').classList.add('sectionhidden');
  document.getElementById('solutionwrapid').classList.add('sectionhidden');
  document.getElementById('codeareaid').value = '';
  document.getElementById('testresultswrapid').innerHTML = '';

  sel.onchange = () => {
    document.getElementById('coderesultid').textContent = solutions[sel.value] || 'no solution for this language';
  };
}


async function loadrandom() {
  document.getElementById('challengetitleid').textContent = '';
  document.getElementById('challengedescid').textContent = 'summoning something you probably cannot solve...';
  document.getElementById('testcaseswrapid').innerHTML = '';
  showsection('randomsection');
  try {
    const data = await apifetchWithFallback(
      '/api/ziza/programming-challenges/get/single/random',
      local => local[Math.floor(Math.random() * local.length)]
    );
    fillchallenge(data);
  } catch(e) {
    document.getElementById('challengetitleid').textContent = '';
    document.getElementById('challengedescid').textContent = 'Could not load. Check your API key. You probably exhausted your quota XD';
  }
}


async function initsearchdropdown() {
  const sel = document.getElementById('challengedropdownid');
  if (sel.options.length > 1) return;
  try {
    const data = await apifetchWithFallback(
      '/api/ziza/programming-challenges/get/all',
      local => local
    );
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.Challenge;
      sel.appendChild(opt);
    });
  } catch(e) {}
}

async function dosearch() {
  const txt = document.getElementById('searchinputid').value.trim();
  const dropval = document.getElementById('challengedropdownid').value;
  const resultbox = document.getElementById('searchresultid');
  resultbox.textContent = 'searching the void...';

  document.getElementById('searchchallengetitleid').textContent = '';
  document.getElementById('searchchallengedescid').textContent = '';
  document.getElementById('searchtestcaseswrapid').innerHTML = '';
  document.getElementById('searchsolutionwrapid').classList.add('sectionhidden');
  document.getElementById('searcheditorwrapid').classList.add('sectionhidden');
  document.getElementById('searchtrybtnid').classList.remove('sectionhidden');
  document.getElementById('searchtestresultswrapid').innerHTML = '';

  try {
    let found;
    if (dropval) {
      found = await apifetchWithFallback(
        `/api/ziza/programming-challenges/single/${dropval}`,
        local => local.find(c => c.id === dropval)
      );
    } else if (txt) {
      const all = await apifetchWithFallback(
        '/api/ziza/programming-challenges/get/all',
        local => local
      );
      found = all.find(c => c.Challenge.toLowerCase().includes(txt.toLowerCase()));
    }
    if (!found) { resultbox.textContent = 'nothing found. maybe try spelling it right.'; return; }
    resultbox.textContent = '';
    fillsearchchallenge(found);
  } catch(e) {
    resultbox.textContent = 'search failed. the internet gods are not with you today.';
  }
}

function fillsearchchallenge(data) {
  searchchallenge = data;
  localStorage.setItem('lastchallengeid', data.id);

  document.getElementById('searchchallengetitleid').textContent = data.Challenge || '';
  const badge = document.getElementById('searchchallengebadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);
  document.getElementById('searchchallengedescid').textContent = data.description || '';

  rendertestcases(document.getElementById('searchtestcaseswrapid'), data.testCases);

  const solutions = getsolutions(data);
  const sel = document.getElementById('searchselectlgeid');
  sel.innerHTML = '';
  Object.keys(solutions).forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.textContent = l;
    sel.appendChild(opt);
  });

  document.getElementById('searchtrybtnid').classList.remove('sectionhidden');
  document.getElementById('searcheditorwrapid').classList.add('sectionhidden');
  document.getElementById('searchsolutionwrapid').classList.add('sectionhidden');
  document.getElementById('searchcodeareaid').value = '';
  document.getElementById('searchtestresultswrapid').innerHTML = '';

  sel.onchange = () => {
    document.getElementById('searchcoderesultid').textContent = solutions[sel.value] || '';
  };
}


async function filterby(difficulty) {
  const listdiv = document.getElementById('filterlistid');
  listdiv.innerHTML = '<p class="loadingmsg">fetching challenges to ruin your day...</p>';
  document.querySelectorAll('.filterbutn').forEach(b => b.classList.remove('activefilter'));
  const activebtn = document.querySelector(`.filterbutn[data-diff="${difficulty}"]`);
  if (activebtn) activebtn.classList.add('activefilter');

  try {
    const data = await apifetchWithFallback(
      `/api/ziza/programming-challenges/get/difficulty/${difficulty}`,
      local => local.filter(c => c.difficulty === difficulty)
    );
    if (!data.length) { listdiv.innerHTML = '<p class="errormsg">no challenges found. suspiciously convenient.</p>'; return; }
    listdiv.innerHTML = '';
    data.forEach(c => {
      const item = document.createElement('div');
      item.className = 'challengelistitem';
      item.innerHTML = `<span class="itemname">${eschtml(c.Challenge)}</span>
        <span class="diffbadge ${badgeclass(c.difficulty)}">${eschtml(c.difficulty)}</span>`;
      item.onclick = () => loadchallengebyid(c.id);
      listdiv.appendChild(item);
    });
  } catch(e) {
    listdiv.innerHTML = '<p class="errormsg">failed to load. not your fault. probably.</p>';
  }
}


function filldetailchallenge(data) {
  detailchallenge = data;
  currentchallenge = data;

  if (!data || data.error) {
    document.getElementById('detailtitleid').textContent = '';
    document.getElementById('detaildescid').textContent = 'Could not load challenge';
    return;
  }

  document.getElementById('detailtitleid').textContent = data.Challenge || '';
  const badge = document.getElementById('detailbadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);
  document.getElementById('detaildescid').textContent = data.description || '';

  rendertestcases(document.getElementById('detailtestcaseswrapid'), data.testCases);

  const solutions = getsolutions(data);
  const sel = document.getElementById('detailselectlgeid');
  sel.innerHTML = '';
  Object.keys(solutions).forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.textContent = l;
    sel.appendChild(opt);
  });

  document.getElementById('detailtrybtnid').classList.remove('sectionhidden');
  document.getElementById('detaileditorwrapid').classList.add('sectionhidden');
  document.getElementById('detailsolutionwrapid').classList.add('sectionhidden');
  document.getElementById('detailcodeareaid').value = '';
  document.getElementById('detailtestresultswrapid').innerHTML = '';

  sel.onchange = () => {
    document.getElementById('detailcoderesultid').textContent = solutions[sel.value] || '';
  };
}

async function loadchallengebyid(id) {
  previoussection = currentsection;
  showsection('challengedetailsection');
  document.getElementById('detailtitleid').textContent = '';
  document.getElementById('detaildescid').textContent = 'loading your next mistake...';
  document.getElementById('detailtestcaseswrapid').innerHTML = '';
  try {
    const data = await apifetchWithFallback(
      `/api/ziza/programming-challenges/single/${id}`,
      local => local.find(c => c.id === id || c.id === String(id))
    );
    filldetailchallenge(data);
  } catch(e) {
    document.getElementById('detailtitleid').textContent = '';
    document.getElementById('detaildescid').textContent = 'Could not load challenge';
  }
}


function showtryeditor(section) {
  const editormap = { random: 'editorwrapid', search: 'searcheditorwrapid', detail: 'detaileditorwrapid' };
  const btnmap = { random: 'trybtnid', search: 'searchtrybtnid', detail: 'detailtrybtnid' };
  const wrap = document.getElementById(editormap[section]);
  const btn = document.getElementById(btnmap[section]);
  if (!wrap) return;
  wrap.classList.remove('sectionhidden');
  if (btn) btn.classList.add('sectionhidden');
}

function showsolution(section) {
  const solmap = { random: 'solutionwrapid', search: 'searchsolutionwrapid', detail: 'detailsolutionwrapid' };
  const editormap = { random: 'editorwrapid', search: 'searcheditorwrapid', detail: 'detaileditorwrapid' };
  const giveupmap = { random: 'giveupbtnid', search: 'searchgiveupbtnid', detail: 'detailgiveupbtnid' };
  const selmap = { random: 'selectlgeid', search: 'searchselectlgeid', detail: 'detailselectlgeid' };
  const codemap = { random: 'coderesultid', search: 'searchcoderesultid', detail: 'detailcoderesultid' };

  const solwrap = document.getElementById(solmap[section]);
  const editorwrap = document.getElementById(editormap[section]);
  const giveupbtn = document.getElementById(giveupmap[section]);
  const sel = document.getElementById(selmap[section]);
  const codebox = document.getElementById(codemap[section]);

  if (solwrap) solwrap.classList.remove('sectionhidden');
  if (editorwrap) editorwrap.classList.add('sectionhidden');
  if (giveupbtn) giveupbtn.classList.add('sectionhidden');

  const challenge = section === 'search' ? searchchallenge : section === 'detail' ? detailchallenge : currentchallenge;
  if (!challenge) return;

  const solutions = getsolutions(challenge);
  const langs = Object.keys(solutions);
  if (!langs.length) return;

  if (sel) {
    sel.innerHTML = '<option value="">fine. pick a language and witness what you should have written.</option>';
    langs.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l; opt.textContent = l;
      sel.appendChild(opt);
    });
    sel.value = langs[0];
    sel.onchange = () => {
      if (codebox) codebox.textContent = solutions[sel.value] || '';
    };
  }
  if (codebox) codebox.textContent = solutions[langs[0]] || '';
}

function runcode(section) {
  const areamap = { random: 'codeareaid', search: 'searchcodeareaid', detail: 'detailcodeareaid' };
  const resultmap = { random: 'testresultswrapid', search: 'searchtestresultswrapid', detail: 'detailtestresultswrapid' };

  const code = document.getElementById(areamap[section]).value.trim();
  const resultdiv = document.getElementById(resultmap[section]);
  resultdiv.innerHTML = '';

  if (!code) {
    resultdiv.innerHTML = '<p class="errormsg">the editor is empty. you have to actually write something.</p>';
    return;
  }

  const challenge = section === 'search' ? searchchallenge : section === 'detail' ? detailchallenge : currentchallenge;

  if (!challenge || !challenge.testCases) {
    resultdiv.innerHTML = '<p class="errormsg">no test cases available. the universe is conspiring against you.</p>';
    return;
  }

  let allpassed = true;

  challenge.testCases.forEach((tc, i) => {
    try {
      const fn = new Function(`${code}\n return typeof solution !== 'undefined' ? solution : undefined;`)();
      let result;
      if (typeof fn === 'function') {
        const input = JSON.parse(tc.input);
        result = Array.isArray(input) ? fn(...input) : fn(input);
      } else {
        resultdiv.innerHTML += `<div class="testcasebox testfail">test ${i+1}: your function needs to be named <span>solution</span>. that is literally the one rule.</div>`;
        allpassed = false;
        return;
      }
      const expected = JSON.parse(tc.output);
      const passed = JSON.stringify(result) === JSON.stringify(expected);
      if (!passed) allpassed = false;
      resultdiv.innerHTML += `<div class="testcasebox ${passed ? 'testpass' : 'testfail'}">
        test ${i+1}: ${passed ? 'passed, as expected from a person of your calibre' : 'failed. do not panic. do panic a little.'} &nbsp;
        got: <span>${eschtml(String(result))}</span> &nbsp;
        expected: <span>${eschtml(tc.output)}</span>
      </div>`;
    } catch(err) {
      allpassed = false;
      resultdiv.innerHTML += `<div class="testcasebox testfail">test ${i+1}: your code threw an error and honestly, same. — <span>${eschtml(err.message)}</span></div>`;
    }
  });

  if (allpassed && challenge.testCases.length > 0) {
    spawnconfetti();
    resultdiv.innerHTML += `<div class="allpassedbanner">all test cases passed. we are as shocked as you are. genuinely did not see that coming.</div>`;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  inittheme();
  const last = localStorage.getItem('lastsection');
  if (last && last !== 'landing') {
    showsection(last);
    if (last === 'randomsection') {
      document.getElementById('challengetitleid').textContent = '';
      document.getElementById('challengedescid').textContent = 'Click the New Random :D button whenever you are ready to suffer.';
      document.getElementById('testcaseswrapid').innerHTML = '';
      document.getElementById('editorwrapid').classList.add('sectionhidden');
      document.getElementById('solutionwrapid').classList.add('sectionhidden');
      document.getElementById('trybtnid').classList.remove('sectionhidden');
    } else if (last === 'searchsection') {
      initsearchdropdown();
    } else if (last === 'filtersection') {
      document.getElementById('filterlistid').innerHTML = '';
      document.querySelectorAll('.filterbutn').forEach(b => b.classList.remove('activefilter'));
    }
  } else {
    showsection('landing');
  }
});