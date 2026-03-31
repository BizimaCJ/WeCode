let currentsection = 'landing';
let currentchallenge = null;

const BASE = 'https://programming-challenges.p.rapidapi.com';
const hdrs = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };


function settheme(t) {
  document.body.classList.toggle('lightmode', t === 'Let there be lyte ;)');
  localStorage.setItem('theme', t);
  const btn = document.getElementById('themebutnid');
  if (btn) btn.textContent = t === 'Let there be lyte ;)' ? 'Let it be dark ' : 'Let there be lyte ;)';
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


async function apifetch(endpoint) {
  const r = await fetch(BASE + endpoint, { headers: hdrs });
  if (!r.ok) throw new Error('api ' + r.status);
  return r.json();
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

function fillchallenge(data) {
  if (!data || data.error) {
    document.getElementById('challengetitleid').textContent = 'failed to load';
    return;
  }
  currentchallenge = data;

  localStorage.setItem('lastchallengeid', data.id);

  document.getElementById('challengetitleid').textContent = data.Challenge || '';
  const badge = document.getElementById('challengebadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);
  
  document.getElementById('challengedescid').textContent = data.description || '';
  
  const tcwrap = document.getElementById('testcaseswrapid');
  tcwrap.innerHTML = '';

  var testCasesArray;

  if (data.testCases) {
    testCasesArray = data.testCases;
  } else {
    testCasesArray = [];
  }

  testCasesArray.forEach(function (t) {
    var box = document.createElement('div');

    box.className = 'testcasebox';

    var inputText = eschtml(t.input);
    var outputText = eschtml(t.output);

    box.innerHTML =
      'input: <span>' +
      inputText +
      '</span> &nbsp; output: <span>' +
      outputText +
      '</span>';

    tcwrap.appendChild(box);
  });

  // for lge dropdown
  const sel = document.getElementById('selectlgeid');
  sel.innerHTML = '';
  const solutions = data.solution || {};
  const langs = Object.keys(solutions);
  langs.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    sel.appendChild(opt);
  });

  // reset give up state
  const giveupbtn = document.getElementById('giveupbtnid');
  const solwrap = document.getElementById('solutionwrapid');
  giveupbtn.classList.remove('sectionhidden');
  solwrap.classList.add('sectionhidden');

  giveupbtn.onclick = () => {
    solwrap.classList.remove('sectionhidden');
    giveupbtn.classList.add('sectionhidden');
    document.getElementById('coderesultid').textContent = solutions[langs[0]] || '';
    sel.value = langs[0];
  };
  sel.onchange = () => {
    document.getElementById('coderesultid').textContent = solutions[sel.value] || 'no solution for this language';
  };
}



async function loadrandom() {
  document.getElementById('challengetitleid').textContent = 'loading...';
  document.getElementById('challengedescid').textContent = '';
  document.getElementById('testcaseswrapid').innerHTML = '';
  showsection('randomsection');
  try {
    const data = await apifetch('/api/ziza/programming-challenges/get/single/random');
    fillchallenge(data);
  } catch(e) {
    document.getElementById('challengetitleid').textContent = 'could not load - check your api key';
  }
}

async function initsearchdropdown() {
  const sel = document.getElementById('challengedropdownid');
  if (sel.options.length > 1) return;

  try {
    const data = await apifetch('/api/ziza/programming-challenges');
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.Challenge;
      sel.appendChild(opt);
    });

  } catch(e) {

  }
}
async function dosearch() {
  const txt = document.getElementById('searchinputid').value.trim();
  const dropval = document.getElementById('challengedropdownid').value;
  const resultbox = document.getElementById('searchresultid');
  resultbox.textContent = 'searching...';
  
  // to clear
  document.getElementById('searchchallengetitleid').textContent = '';
  document.getElementById('searchchallengedescid').textContent = '';
  document.getElementById('searchtestcaseswrapid').innerHTML = '';
  document.getElementById('searchsolutionwrapid').classList.add('sectionhidden');
  document.getElementById('searchgiveupbtnid').classList.remove('sectionhidden');

  try {
    let found;
    if (dropval) {
      found = await apifetch(`/api/ziza/programming-challenges/single/${dropval}`);
    } else if (txt) {
      const all = await apifetch('/api/ziza/programming-challenges');
      found = all.find(c => c.Challenge.toLowerCase().includes(txt.toLowerCase()));

    }
    if (!found) { resultbox.textContent = 'no results found'; return; }
    resultbox.textContent = '';
    fillsearchchallenge(found);
    } catch(e) {
      resultbox.textContent = 'search failed';
  }
}

function fillsearchchallenge(data) {
  currentchallenge = data;
  localStorage.setItem('lastchallengeid', data.id);
  document.getElementById('searchchallengetitleid').textContent = data.Challenge || '';

  const badge = document.getElementById('searchchallengebadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);
  document.getElementById('searchchallengedescid').textContent = data.description || '';

  const tcwrap = document.getElementById('searchtestcaseswrapid');
  tcwrap.innerHTML = '';
  (data.testCases || []).forEach(t => {
    const box = document.createElement('div');
    box.className = 'testcasebox';
    box.innerHTML = `input: <span>${eschtml(t.input)}</span> &nbsp; output: <span>${eschtml(t.output)}</span>`;
    tcwrap.appendChild(box);
  });

  const sel = document.getElementById('searchselectlgeid');
  sel.innerHTML = '';

  const solutions = data.solution || {};
  const langs = Object.keys(solutions);
  langs.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.textContent = l;
    sel.appendChild(opt);
  });
  const giveupbtn = document.getElementById('searchgiveupbtnid');
  const solwrap = document.getElementById('searchsolutionwrapid');

  giveupbtn.onclick = () => {
    solwrap.classList.remove('sectionhidden');
    giveupbtn.classList.add('sectionhidden');
    document.getElementById('searchcoderesultid').textContent = solutions[langs[0]] || '';
    sel.value = langs[0];
  };
  sel.onchange = () => {
    document.getElementById('searchcoderesultid').textContent = solutions[sel.value] || '';
  };
}


async function filterby(difficulty) {
  const listdiv = document.getElementById('filterlistid');
  listdiv.innerHTML = '<p class="loadingmsg">loading...</p>';
  document.querySelectorAll('.filterbutn').forEach(b => b.classList.remove('activefilter'));
  const activebtn = document.querySelector(`.filterbutn[data-diff="${difficulty}"]`);
  if (activebtn) activebtn.classList.add('activefilter');
  
  try {
  const data = await apifetch(`/api/ziza/programming-challenges/get/difficulty/${difficulty}`);
  if (!data.length) { listdiv.innerHTML = '<p class="errormsg">no challenges found</p>'; return; }
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
    listdiv.innerHTML = '<p class="errormsg">failed to load</p>';
  }
}




//init. finally!!! show landing page
document.addEventListener('DOMContentLoaded', () => {
    inittheme();
    const last = localStorage.getItem('lastsection');
    if (last && last !== 'landing') {
        showsection(last);
        // reset state depending on which section we're restoring
        if (last === 'randomsection') {
            document.getElementById('challengetitleid').textContent = 'click new random to load a challenge';
            document.getElementById('challengedescid').textContent = '';
            document.getElementById('testcaseswrapid').innerHTML = '';
            document.getElementById('editorwrapid').classList.add('sectionhidden');
            document.getElementById('solutionwrapid').classList.add('sectionhidden');
            document.getElementById('trybtnid').classList.remove('sectionhidden');
            document.getElementById('giveupbtnid').classList.remove('sectionhidden');
        } else if (last === 'searchsection') {
            document.getElementById('searchchallengetitleid').textContent = '';
            document.getElementById('searchchallengedescid').textContent = '';
            document.getElementById('searchtestcaseswrapid').innerHTML = '';
            document.getElementById('searchresultid').textContent = '';
            document.getElementById('searchinputid').value = '';
            document.getElementById('searcheditorwrapid').classList.add('sectionhidden');
            document.getElementById('searchsolutionwrapid').classList.add('sectionhidden');
            document.getElementById('searchtrybtnid').classList.remove('sectionhidden');
            document.getElementById('searchgiveupbtnid').classList.remove('sectionhidden');
        } else if (last === 'filtersection') {
            document.getElementById('filterlistid').innerHTML = '';
            document.querySelectorAll('.filterbutn').forEach(b => b.classList.remove('activefilter'));
        }
    } else {
        showsection('landing');
    }
});




function filldetailchallenge(data) {
  currentchallenge = data;
    if (!data || data.error) {
        document.getElementById('detailtitleid').textContent = 'failed to load';
        return;
    }

    document.getElementById('detailtitleid').textContent = data.Challenge || '';
    const badge = document.getElementById('detailbadgeid');
    badge.textContent = data.difficulty || '';
    badge.className = 'diffbadge ' + badgeclass(data.difficulty);

    document.getElementById('detaildescid').textContent = data.description || '';

    const tcwrap = document.getElementById('detailtestcaseswrapid');
    tcwrap.innerHTML = '';
    (data.testCases || []).forEach(t => {
        const box = document.createElement('div');
        box.className = 'testcasebox';
        box.innerHTML = `input: <span>${eschtml(t.input)}</span> &nbsp; output: <span>${eschtml(t.output)}</span>`;
        tcwrap.appendChild(box);
    });

    const sel = document.getElementById('detailselectlgeid');
    sel.innerHTML = '';
    const solutions = data.solution || {};
    const langs = Object.keys(solutions);
    langs.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l; opt.textContent = l;
        sel.appendChild(opt);
    });

    const giveupbtn = document.getElementById('detailgiveupbtnid');
    const solwrap = document.getElementById('detailsolutionwrapid');
    giveupbtn.classList.remove('sectionhidden');
    solwrap.classList.add('sectionhidden');
    giveupbtn.onclick = () => {
        solwrap.classList.remove('sectionhidden');
        giveupbtn.classList.add('sectionhidden');
        document.getElementById('detailcoderesultid').textContent = solutions[langs[0]] || '';
        sel.value = langs[0];
    };
    sel.onchange = () => {
        document.getElementById('detailcoderesultid').textContent = solutions[sel.value] || '';
    };
}

async function loadchallengebyid(id) {
    showsection('challengedetailsection');
    document.getElementById('detailtitleid').textContent = 'loading...'; // <-- changed
    document.getElementById('detaildescid').textContent = '';            // <-- changed
    document.getElementById('detailtestcaseswrapid').innerHTML = '';     // <-- changed
    try {
        const data = await apifetch(`/api/ziza/programming-challenges/single/${id}`);
        filldetailchallenge(data); // <-- changed
    } catch(e) {
        document.getElementById('detailtitleid').textContent = 'could not load challenge'; // <-- changed
    }
}

function showtryeditor(section) {
    const editormap = {
        'random': 'editorwrapid',
        'search': 'searcheditorwrapid',
        'detail': 'detaileditorwrapid'
    };
    const btnmap = {
        'random': 'trybtnid',
        'search': 'searchtrybtnid',
        'detail': 'detailtrybtnid'
    };
    const wrap = document.getElementById(editormap[section]);
    const btn = document.getElementById(btnmap[section]);
    if (!wrap) return;
    wrap.classList.remove('sectionhidden');
    if (btn) btn.classList.add('sectionhidden');
}

function showsolution(section) {
    const solmap = {
        'random': 'solutionwrapid',
        'search': 'searchsolutionwrapid',
        'detail': 'detailsolutionwrapid'
    };
    const giveupmap = {
        'random': 'giveupbtnid',
        'search': 'searchgiveupbtnid',
        'detail': 'detailgiveupbtnid'
    };
    const editormap = {
        'random': 'editorwrapid',
        'search': 'searcheditorwrapid',
        'detail': 'detaileditorwrapid'
    };

    const solwrap = document.getElementById(solmap[section]);
    const giveupbtn = document.getElementById(giveupmap[section]);
    const editorwrap = document.getElementById(editormap[section]);

    if (solwrap) solwrap.classList.remove('sectionhidden');
    if (giveupbtn) giveupbtn.classList.add('sectionhidden');
    if (editorwrap) editorwrap.classList.add('sectionhidden');

    // fill solution using currentchallenge
    const sectionmap = { 'random': 'selectlgeid', 'search': 'searchselectlgeid', 'detail': 'detailselectlgeid' };
    const codemap = { 'random': 'coderesultid', 'search': 'searchcoderesultid', 'detail': 'detailcoderesultid' };
    const sel = document.getElementById(sectionmap[section]);
    const codebox = document.getElementById(codemap[section]);
    if (sel && codebox && currentchallenge) {
        const solutions = currentchallenge.solution || {};
        codebox.textContent = solutions[sel.value] || solutions[Object.keys(solutions)[0]] || '';
    }
}

function runcode(section) {
    const areamap = {
        'random': 'codeareaid',
        'search': 'searchcodeareaid',
        'detail': 'detailcodeareaid'
    };
    const resultmap = {
        'random': 'testresultswrapid',
        'search': 'searchtestresultswrapid',
        'detail': 'detailtestresultswrapid'
    };

    const code = document.getElementById(areamap[section]).value.trim();
    const resultdiv = document.getElementById(resultmap[section]);
    resultdiv.innerHTML = '';

    if (!code) {
        resultdiv.innerHTML = '<p class="errormsg">write some code first</p>';
        return;
    }

    if (!currentchallenge || !currentchallenge.testCases) {
        resultdiv.innerHTML = '<p class="errormsg">no test cases available</p>';
        return;
    }

    // run user code against test cases using eval
    // this only works for js solutions obv
    currentchallenge.testCases.forEach((tc, i) => {
        try {
            const fn = new Function(`${code}\n return typeof solution !== 'undefined' ? solution : undefined;`)();
            let result;
            if (typeof fn === 'function') {
                const input = JSON.parse(tc.input);
                result = Array.isArray(input) ? fn(...input) : fn(input);
            } else {
                resultdiv.innerHTML += `<div class="testcasebox"><span>test ${i+1}: make sure your function is named 'solution'</span></div>`;
                return;
            }
            const expected = JSON.parse(tc.output);
            const passed = JSON.stringify(result) === JSON.stringify(expected);
            resultdiv.innerHTML += `<div class="testcasebox ${passed ? 'testpass' : 'testfail'}">
                test ${i+1}: ${passed ? 'passed' : 'failed'} &nbsp;
                got: <span>${eschtml(String(result))}</span> &nbsp;
                expected: <span>${eschtml(tc.output)}</span>
            </div>`;
        } catch(err) {
            resultdiv.innerHTML += `<div class="testcasebox testfail">test ${i+1}: error - <span>${eschtml(err.message)}</span></div>`;
        }
    });
}

