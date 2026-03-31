let currentsection = 'landing';
let currentchallenge = null;
let searchchallenge = null;
let detailchallenge = null;
let localchallenges = null;
let previoussection = 'filtersection';

const BASE = 'https://programming-challenges.p.rapidapi.com';
const hdrs = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST
};

// theme stuff
function settheme(t) {
  document.body.classList.toggle('lightmode', t === 'Let there be lyte ;)');
  localStorage.setItem('theme', t);
  var btn = document.getElementById('themebutnid');
  if (btn) btn.textContent = t === 'Let there be lyte ;)' ? 'Let it be dark' : 'Let there be lyte ;)';
}

function inittheme() {
  var saved = localStorage.getItem('theme');
  settheme(saved || 'Let it be dark');
}

function toggletheme() {
  var cur = localStorage.getItem('theme');
  if (cur === 'Let there be lyte ;)') {
    settheme('Let it be dark');
  } else {
    settheme('Let there be lyte ;)');
  }
}

// show the right section and hide everything else
function showsection(id) {
  var all = document.querySelectorAll('.appsection');
  for (var i = 0; i < all.length; i++) {
    all[i].classList.add('sectionhidden');
  }

  var target = document.getElementById(id);
  if (target) target.classList.remove('sectionhidden');

  var navlinks = document.querySelectorAll('.navlinkitem');
  for (var i = 0; i < navlinks.length; i++) {
    navlinks[i].classList.remove('activenav');
  }

  var activelink = document.querySelector('.navlinkitem[data-section="' + id + '"]');
  if (activelink) activelink.classList.add('activenav');

  var nav = document.getElementById('navwrapid');
  if (id === 'landing') {
    nav.classList.add('sectionhidden');
  } else {
    nav.classList.remove('sectionhidden');
  }

  localStorage.setItem('lastsection', id);
  currentsection = id;
}

function getstarted() {
  showsection('dashboard');
}

// i wrote this so the app doesnt fully break when api runs out
async function loadlocalchallenges() {
  if (localchallenges) return localchallenges;
  try {
    var r = await fetch('challenges.json');
    if (!r.ok) return null;
    localchallenges = await r.json();
    return localchallenges;
  } catch(e) {
    return null;
  }
}

async function apifetch(endpoint) {
  var r = await fetch(BASE + endpoint, { headers: hdrs });
  if (!r.ok) throw new Error('api error: ' + r.status);
  return r.json();
}

// tries the api first, falls back to local json if it fails
async function apifetchWithFallback(endpoint, fallbackfn) {
  try {
    return await apifetch(endpoint);
  } catch(e) {
    var local = await loadlocalchallenges();
    if (!local) throw e;
    return fallbackfn(local);
  }
}

function eschtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badgeclass(diff) {
  if (!diff) return '';
  var d = diff.toLowerCase();
  if (d === 'beginner') return 'diffbeginner';
  if (d === 'intermediate') return 'diffintermediate';
  return 'diffexpert';
}

// the api returns solution as an array with one object inside
// dumb ways to die 
function getsolutions(data) {
  var raw = data.solution;
  if (Array.isArray(raw)) return raw[0];
  return raw || {};
}

function rendertestcases(wrap, testCases) {
  wrap.innerHTML = '';
  var cases = testCases || [];
  for (var i = 0; i < cases.length; i++) {
    var box = document.createElement('div');
    box.className = 'testcasebox';
    box.innerHTML = 'input: <span>' + eschtml(cases[i].input) + '</span> &nbsp; output: <span>' + eschtml(cases[i].output) + '</span>';
    wrap.appendChild(box);
  }
}

// confetti when all tests pass :)
function spawnconfetti() {
  var colors = ['#4a8ef5', '#3fb950', '#d4a020', '#a78bfa', '#f97316'];
  var wrap = document.createElement('div');
  wrap.className = 'confettiwrap';
  document.body.appendChild(wrap);

  for (var i = 0; i < 120; i++) {
    var piece = document.createElement('div');
    piece.className = 'confettipiece';
    piece.style.left = (Math.random() * 100) + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = piece.style.width;
    piece.style.animationDelay = (Math.random() * 0.8) + 's';
    piece.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.opacity = 0.7 + Math.random() * 0.3;
    wrap.appendChild(piece);
  }

  setTimeout(function() { wrap.remove(); }, 4000);
}

function fillchallenge(data) {
  if (!data || data.error) {
    document.getElementById('challengedescid').textContent = 'Could not load. Check your API key. You probably exhausted your quota XD';
    return;
  }

  currentchallenge = data;
  localStorage.setItem('lastchallengeid', data.id);

  document.getElementById('challengetitleid').textContent = data.Challenge || '';

  var badge = document.getElementById('challengebadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);

  document.getElementById('challengedescid').textContent = data.description || '';

  rendertestcases(document.getElementById('testcaseswrapid'), data.testCases);

  var solutions = getsolutions(data);
  var sel = document.getElementById('selectlgeid');
  sel.innerHTML = '';
  var langs = Object.keys(solutions);
  for (var i = 0; i < langs.length; i++) {
    var opt = document.createElement('option');
    opt.value = langs[i];
    opt.textContent = langs[i];
    sel.appendChild(opt);
  }

  // reset editor and solution state
  document.getElementById('trybtnid').classList.remove('sectionhidden');
  document.getElementById('editorwrapid').classList.add('sectionhidden');
  document.getElementById('solutionwrapid').classList.add('sectionhidden');
  document.getElementById('codeareaid').value = '';
  document.getElementById('testresultswrapid').innerHTML = '';

  sel.onchange = function() {
    document.getElementById('coderesultid').textContent = solutions[sel.value] || 'no solution for this language';
  };
}

async function loadrandom() {
  document.getElementById('challengetitleid').textContent = '';
  document.getElementById('challengedescid').textContent = 'summoning something you probably cannot solve...';
  document.getElementById('testcaseswrapid').innerHTML = '';
  showsection('randomsection');

  try {
    var data = await apifetchWithFallback(
      '/api/ziza/programming-challenges/get/single/random',
      function(local) { return local[Math.floor(Math.random() * local.length)]; }
    );
    fillchallenge(data);
  } catch(e) {
    document.getElementById('challengedescid').textContent = 'Could not load. Check your API key. You probably exhausted your quota XD';
  }
}

async function initsearchdropdown() {
  var sel = document.getElementById('challengedropdownid');
  if (sel.options.length > 1) return;

  try {
    var data = await apifetchWithFallback(
      '/api/ziza/programming-challenges',
      function(local) { return local; }
    );
    for (var i = 0; i < data.length; i++) {
      var opt = document.createElement('option');
      opt.value = data[i].id;
      opt.textContent = data[i].Challenge;
      sel.appendChild(opt);
    }
  } catch(e) {
    // if the api fails, we can still search by fetching all challenges from local json and filtering in the search function, so no need to do anything here
  }
}

async function dosearch() {
  var txt = document.getElementById('searchinputid').value.trim();
  var dropval = document.getElementById('challengedropdownid').value;
  var resultbox = document.getElementById('searchresultid');
  resultbox.textContent = 'searching the void...';

  document.getElementById('searchchallengetitleid').textContent = '';
  document.getElementById('searchchallengedescid').textContent = '';
  document.getElementById('searchtestcaseswrapid').innerHTML = '';
  document.getElementById('searchsolutionwrapid').classList.add('sectionhidden');
  document.getElementById('searcheditorwrapid').classList.add('sectionhidden');
  document.getElementById('searchtrybtnid').classList.remove('sectionhidden');
  document.getElementById('searchtestresultswrapid').innerHTML = '';

  try {
    var found;
    if (dropval) {
      found = await apifetchWithFallback(
        '/api/ziza/programming-challenges/single/' + dropval,
        function(local) { return local.find(function(c) { return c.id === dropval; }); }
      );
    } else if (txt) {
      var all = await apifetchWithFallback(
        '/api/ziza/programming-challenges',
        function(local) { return local; }
      );
      found = all.find(function(c) {
        return c.Challenge.toLowerCase().includes(txt.toLowerCase());
      });
    }

    if (!found) {
      resultbox.textContent = 'nothing found. maybe try spelling it right.';
      return;
    }
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

  var badge = document.getElementById('searchchallengebadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);

  document.getElementById('searchchallengedescid').textContent = data.description || '';

  rendertestcases(document.getElementById('searchtestcaseswrapid'), data.testCases);

  var solutions = getsolutions(data);
  var sel = document.getElementById('searchselectlgeid');
  sel.innerHTML = '';
  var langs = Object.keys(solutions);
  for (var i = 0; i < langs.length; i++) {
    var opt = document.createElement('option');
    opt.value = langs[i];
    opt.textContent = langs[i];
    sel.appendChild(opt);
  }

  document.getElementById('searchtrybtnid').classList.remove('sectionhidden');
  document.getElementById('searcheditorwrapid').classList.add('sectionhidden');
  document.getElementById('searchsolutionwrapid').classList.add('sectionhidden');
  document.getElementById('searchcodeareaid').value = '';
  document.getElementById('searchtestresultswrapid').innerHTML = '';

  sel.onchange = function() {
    document.getElementById('searchcoderesultid').textContent = solutions[sel.value] || '';
  };
}

async function filterby(difficulty) {
  var listdiv = document.getElementById('filterlistid');
  listdiv.innerHTML = '<p class="loadingmsg">fetching challenges to ruin your day...</p>';

  var allbtns = document.querySelectorAll('.filterbutn');
  for (var i = 0; i < allbtns.length; i++) {
    allbtns[i].classList.remove('activefilter');
  }
  var activebtn = document.querySelector('.filterbutn[data-diff="' + difficulty + '"]');
  if (activebtn) activebtn.classList.add('activefilter');

  try {
    var data = await apifetchWithFallback(
      '/api/ziza/programming-challenges/get/difficulty/' + difficulty,
      function(local) {
        return local.filter(function(c) { return c.difficulty === difficulty; });
      }
    );

    if (!data.length) {
      listdiv.innerHTML = '<p class="errormsg">no challenges found. suspiciously convenient.</p>';
      return;
    }

    listdiv.innerHTML = '';
    for (var i = 0; i < data.length; i++) {
      var item = document.createElement('div');
      item.className = 'challengelistitem';
      item.innerHTML = '<span class="itemname">' + eschtml(data[i].Challenge) + '</span><span class="diffbadge ' + badgeclass(data[i].difficulty) + '">' + eschtml(data[i].difficulty) + '</span>';
      // need this wrapper to keep the id in scope
      (function(id) {
        item.onclick = function() { loadchallengebyid(id); };
      })(data[i].id);
      listdiv.appendChild(item);
    }
  } catch(e) {
    listdiv.innerHTML = '<p class="errormsg">failed to load. not your fault. probably.</p>';
  }
}

function filldetailchallenge(data) {
  detailchallenge = data;
  currentchallenge = data;

  if (!data || data.error) {
    document.getElementById('detaildescid').textContent = 'Could not load challenge';
    return;
  }

  document.getElementById('detailtitleid').textContent = data.Challenge || '';

  var badge = document.getElementById('detailbadgeid');
  badge.textContent = data.difficulty || '';
  badge.className = 'diffbadge ' + badgeclass(data.difficulty);

  document.getElementById('detaildescid').textContent = data.description || '';

  rendertestcases(document.getElementById('detailtestcaseswrapid'), data.testCases);

  var solutions = getsolutions(data);
  var sel = document.getElementById('detailselectlgeid');
  sel.innerHTML = '';
  var langs = Object.keys(solutions);
  for (var i = 0; i < langs.length; i++) {
    var opt = document.createElement('option');
    opt.value = langs[i];
    opt.textContent = langs[i];
    sel.appendChild(opt);
  }

  document.getElementById('detailtrybtnid').classList.remove('sectionhidden');
  document.getElementById('detaileditorwrapid').classList.add('sectionhidden');
  document.getElementById('detailsolutionwrapid').classList.add('sectionhidden');
  document.getElementById('detailcodeareaid').value = '';
  document.getElementById('detailtestresultswrapid').innerHTML = '';

  sel.onchange = function() {
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
    var data = await apifetchWithFallback(
      '/api/ziza/programming-challenges/single/' + id,
      function(local) {
        return local.find(function(c) { return c.id === id || c.id === String(id); });
      }
    );
    filldetailchallenge(data);
  } catch(e) {
    document.getElementById('detaildescid').textContent = 'Could not load challenge';
  }
}

function showtryeditor(section) {
  var editors = { random: 'editorwrapid', search: 'searcheditorwrapid', detail: 'detaileditorwrapid' };
  var btns = { random: 'trybtnid', search: 'searchtrybtnid', detail: 'detailtrybtnid' };

  var wrap = document.getElementById(editors[section]);
  var btn = document.getElementById(btns[section]);
  if (!wrap) return;

  wrap.classList.remove('sectionhidden');
  if (btn) btn.classList.add('sectionhidden');
}

function showsolution(section) {
  var solmap = { random: 'solutionwrapid', search: 'searchsolutionwrapid', detail: 'detailsolutionwrapid' };
  var editormap = { random: 'editorwrapid', search: 'searcheditorwrapid', detail: 'detaileditorwrapid' };
  var giveupmap = { random: 'giveupbtnid', search: 'searchgiveupbtnid', detail: 'detailgiveupbtnid' };
  var selmap = { random: 'selectlgeid', search: 'searchselectlgeid', detail: 'detailselectlgeid' };
  var codemap = { random: 'coderesultid', search: 'searchcoderesultid', detail: 'detailcoderesultid' };

  var solwrap = document.getElementById(solmap[section]);
  var editorwrap = document.getElementById(editormap[section]);
  var giveupbtn = document.getElementById(giveupmap[section]);
  var sel = document.getElementById(selmap[section]);
  var codebox = document.getElementById(codemap[section]);

  if (solwrap) solwrap.classList.remove('sectionhidden');
  if (editorwrap) editorwrap.classList.add('sectionhidden');
  if (giveupbtn) giveupbtn.classList.add('sectionhidden');

  var challenge = section === 'search' ? searchchallenge : section === 'detail' ? detailchallenge : currentchallenge;
  if (!challenge) return;

  var solutions = getsolutions(challenge);
  var langs = Object.keys(solutions);
  if (!langs.length) return;

  if (sel) {
    sel.innerHTML = '';
    for (var i = 0; i < langs.length; i++) {
      var opt = document.createElement('option');
      opt.value = langs[i];
      opt.textContent = langs[i];
      sel.appendChild(opt);
    }
    sel.value = langs[0];

    // keep reference for onchange
    var solutionsref = solutions;
    var codeboxref = codebox;
    sel.onchange = function() {
      if (codeboxref) codeboxref.textContent = solutionsref[sel.value] || '';
    };
  }

  if (codebox) codebox.textContent = solutions[langs[0]] || '';
}

function runcode(section) {
  var areamap = { random: 'codeareaid', search: 'searchcodeareaid', detail: 'detailcodeareaid' };
  var resultmap = { random: 'testresultswrapid', search: 'searchtestresultswrapid', detail: 'detailtestresultswrapid' };

  var code = document.getElementById(areamap[section]).value.trim();
  var resultdiv = document.getElementById(resultmap[section]);
  resultdiv.innerHTML = '';

  if (!code) {
    resultdiv.innerHTML = '<p class="errormsg">the editor is empty. you have to actually write something.</p>';
    return;
  }

  var challenge = section === 'search' ? searchchallenge : section === 'detail' ? detailchallenge : currentchallenge;

  if (!challenge || !challenge.testCases) {
    resultdiv.innerHTML = '<p class="errormsg">no test cases available.</p>';
    return;
  }

  var allpassed = true;

  for (var i = 0; i < challenge.testCases.length; i++) {
    var tc = challenge.testCases[i];
    try {
      var fn = new Function(code + '\n return typeof solution !== "undefined" ? solution : undefined;')();
      var result;

      if (typeof fn === 'function') {
        var input = JSON.parse(tc.input);
        result = Array.isArray(input) ? fn.apply(null, input) : fn(input);
      } else {
        resultdiv.innerHTML += '<div class="testcasebox testfail">test ' + (i+1) + ': your function needs to be named <span>solution</span>. that is literally the one rule.</div>';
        allpassed = false;
        continue;
      }

      var expected = JSON.parse(tc.output);
      var passed = JSON.stringify(result) === JSON.stringify(expected);
      if (!passed) allpassed = false;

      resultdiv.innerHTML += '<div class="testcasebox ' + (passed ? 'testpass' : 'testfail') + '">' +
        'test ' + (i+1) + ': ' + (passed ? 'passed' : 'failed') + ' &nbsp; ' +
        'got: <span>' + eschtml(String(result)) + '</span> &nbsp; ' +
        'expected: <span>' + eschtml(tc.output) + '</span>' +
        '</div>';
    } catch(err) {
      allpassed = false;
      resultdiv.innerHTML += '<div class="testcasebox testfail">test ' + (i+1) + ': error — <span>' + eschtml(err.message) + '</span></div>';
    }
  }

  if (allpassed && challenge.testCases.length > 0) {
    spawnconfetti();
    resultdiv.innerHTML += '<div class="allpassedbanner">all test cases passed. genuinely did not see that coming.</div>';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  inittheme();

  var last = localStorage.getItem('lastsection');
  if (last && last !== 'landing') {
    showsection(last);

    if (last === 'randomsection') {
      document.getElementById('challengetitleid').textContent = '';
      document.getElementById('challengedescid').textContent = 'Click the button whenever you are ready to suffer.';
      document.getElementById('testcaseswrapid').innerHTML = '';
      document.getElementById('editorwrapid').classList.add('sectionhidden');
      document.getElementById('solutionwrapid').classList.add('sectionhidden');
      document.getElementById('trybtnid').classList.remove('sectionhidden');
    } else if (last === 'searchsection') {
      initsearchdropdown();
    } else if (last === 'filtersection') {
      document.getElementById('filterlistid').innerHTML = '';
      var btns = document.querySelectorAll('.filterbutn');
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('activefilter');
      }
    }
  } else {
    showsection('landing');
  }
});
