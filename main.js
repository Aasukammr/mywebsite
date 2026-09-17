(function () {
  'use strict';

  function init() {
    const book = String(window.NCE_BOOK || 2);
    const data = window['__NCE' + book];
    if (!data || data.length === 0) {
      showEmpty();
      return;
    }

    const prefix = book + '-';
    const list = document.getElementById('lessonList');
    const select = document.getElementById('lessonSelect');
    const filter = document.getElementById('lessonFilter');
    const content = document.getElementById('lessonContent');

    function lessonNum(id) {
      return id.replace(prefix, '').replace(/^0+/, '');
    }

    function renderLessonList(items) {
      list.innerHTML = items.map(function (l) {
        return '<a href="#' + l.id + '" class="lesson-link" data-id="' + l.id + '">' +
          '<span class="lesson-num">' + lessonNum(l.id) + '</span>' +
          '<div class="lesson-title-group">' +
          '<span class="lesson-title-en">' + l.title + '</span>' +
          '<span class="lesson-title-cn">' + l.titleCn + '</span>' +
          '</div></a>';
      }).join('');
    }

    function renderSelect(items) {
      select.innerHTML = items.map(function (l) {
        return '<option value="' + l.id + '">' +
          lessonNum(l.id) + ' ' + l.title + ' — ' + l.titleCn +
          '</option>';
      }).join('');
    }

    renderLessonList(data);
    renderSelect(data);

    function getLesson(id) {
      return data.find(l => l.id === id);
    }

    function loadLesson(id) {
      const lesson = getLesson(id);
      if (!lesson) return;

      document.querySelectorAll('.lesson-link').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
      });

      select.value = id;
      history.replaceState(null, '', '#' + id);

      var num = lessonNum(lesson.id);
      content.innerHTML = '\
        <article class="lesson-article">\
          <div class="lesson-header">\
            <h2>Lesson ' + num + ' ' + lesson.title + '</h2>\
            <div class="lesson-subtitle">' + lesson.titleCn + '</div>\
          </div>\
          <section class="lesson-english">' + mdToHtml(lesson.english) + '</section>\
          <section class="lesson-chinese">\
            <h3>中文翻译</h3>\
            ' + mdToHtml(lesson.chinese) + '\
          </section>\
          ' + (lesson.words && lesson.words.length ? renderWords(lesson.words) : '') + '\
        </article>';
    }

    // Click on sidebar
    list.addEventListener('click', function (e) {
      const link = e.target.closest('.lesson-link');
      if (link) {
        e.preventDefault();
        loadLesson(link.dataset.id);
      }
    });

    // Select change on mobile
    select.addEventListener('change', function () {
      loadLesson(this.value);
      content.scrollIntoView({ behavior: 'smooth' });
    });

    // Filter
    filter.addEventListener('input', function () {
      const q = this.value.toLowerCase().trim();
      const filtered = q
        ? data.filter(l =>
            l.title.toLowerCase().includes(q) ||
            l.titleCn.includes(q) ||
            (l.words && l.words.some(w => w.en.includes(q) || w.cn.includes(q)))
          )
        : data;
      renderLessonList(filtered);
      renderSelect(filtered);
      if (filtered.length > 0) {
        loadLesson(filtered[0].id);
      } else {
        content.innerHTML = '<div class="empty-state"><p>未找到匹配的课文</p></div>';
      }
    });

    // Hash change
    window.addEventListener('hashchange', function () {
      const id = location.hash.slice(1);
      if (id && getLesson(id)) loadLesson(id);
    });

    // Initial load
    const hash = location.hash.slice(1);
    const initial = (hash && getLesson(hash)) ? hash : data[0].id;
    loadLesson(initial);

    // Scroll active into view
    setTimeout(function () {
      const active = document.querySelector('.lesson-link.active');
      if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
  }

  function mdToHtml(text) {
    if (!text) return '';
    return text.split('\n\n').filter(function (p) { return p.trim(); }).map(function (p) {
      var t = p.trim();
      t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
      return '<p>' + t.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function renderWords(words) {
    return `
      <section class="lesson-words">
        <h3>单词 Vocabulary</h3>
        <div class="words-grid">
          ${words.map(function (w) {
            return '<div class="word-card"><span class="en">' + w.en + '</span><span class="cn">' + w.cn + '</span></div>';
          }).join('')}
        </div>
      </section>
    `;
  }

  function showEmpty() {
    document.getElementById('lessonContent').innerHTML =
      '<div class="empty-state"><p>还没有课文</p><p>在 lessons/ 目录下添加 .md 文件，然后运行 npm run build</p></div>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
