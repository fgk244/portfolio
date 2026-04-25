import { questions, CATEGORIES, LEVELS } from "./questions.js";

const LEVEL_THRESHOLDS = [
  { min: 90, label: "エキスパート", color: "#a855f7", desc: "JS の深い知識を持ち、実務で高度な実装ができるレベルです。" },
  { min: 75, label: "上級",         color: "#3b82f6", desc: "複雑な処理や最新の仕様を実務で活用できるレベルです。" },
  { min: 55, label: "中級",         color: "#10b981", desc: "基本から応用まで幅広く理解しており、実務でも活躍できるレベルです。" },
  { min: 35, label: "初級",         color: "#f59e0b", desc: "基本的な構文は理解できており、さらなる深堀りで成長できるレベルです。" },
  { min: 0,  label: "入門",         color: "#6b7280", desc: "JS の基礎を学び始めているレベルです。基本文法から着実に積み上げましょう。" },
];

class QuizApp {
  constructor() {
    this.allQuestions = [...questions].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.answers = [];
    this.selectedChoice = null;
    this.confirmed = false;

    this.screens = {
      start:   document.getElementById("screen-start"),
      quiz:    document.getElementById("screen-quiz"),
      result:  document.getElementById("screen-result"),
    };

    this.bind();
    this.showScreen("start");
  }

  bind() {
    document.getElementById("btn-start").addEventListener("click", () => this.startQuiz());
    document.getElementById("btn-next").addEventListener("click", () => this.nextQuestion());
    document.getElementById("btn-restart").addEventListener("click", () => this.restart());
  }

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove("active"));
    this.screens[name].classList.add("active");
  }

  startQuiz() {
    this.currentIndex = 0;
    this.answers = [];
    this.showScreen("quiz");
    this.renderQuestion();
  }

  renderQuestion() {
    this.selectedChoice = null;
    this.confirmed = false;

    const q = this.allQuestions[this.currentIndex];
    const total = this.allQuestions.length;
    const progress = ((this.currentIndex) / total) * 100;

    document.getElementById("progress-bar-fill").style.width = `${progress}%`;
    document.getElementById("progress-text").textContent = `${this.currentIndex + 1} / ${total}`;
    document.getElementById("q-category").textContent = q.category;
    document.getElementById("q-level").textContent = q.level;
    document.getElementById("q-level").className = `badge level-${this.levelClass(q.level)}`;
    document.getElementById("q-number").textContent = `Q${this.currentIndex + 1}`;
    document.getElementById("q-text").textContent = q.question;

    const choicesEl = document.getElementById("q-choices");
    choicesEl.innerHTML = "";
    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice;
      btn.dataset.index = i;
      btn.addEventListener("click", () => this.selectChoice(i));
      choicesEl.appendChild(btn);
    });

    document.getElementById("q-explanation").classList.add("hidden");
    document.getElementById("btn-next").disabled = true;
    document.getElementById("btn-next").textContent =
      this.currentIndex + 1 < total ? "次の問題 →" : "結果を見る";
  }

  levelClass(level) {
    const map = { "初級": "beginner", "中級": "intermediate", "上級": "advanced" };
    return map[level] || "beginner";
  }

  selectChoice(index) {
    if (this.confirmed) return;
    this.selectedChoice = index;

    document.querySelectorAll(".choice-btn").forEach((btn, i) => {
      btn.classList.toggle("selected", i === index);
    });

    this.confirmAnswer();
  }

  confirmAnswer() {
    if (this.selectedChoice === null) return;
    this.confirmed = true;

    const q = this.allQuestions[this.currentIndex];
    const isCorrect = this.selectedChoice === q.answer;

    this.answers.push({
      question: q,
      selected: this.selectedChoice,
      correct: isCorrect,
    });

    document.querySelectorAll(".choice-btn").forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add("correct");
      else if (i === this.selectedChoice && !isCorrect) btn.classList.add("wrong");
    });

    const expEl = document.getElementById("q-explanation");
    expEl.textContent = `💡 ${q.explanation}`;
    expEl.classList.remove("hidden");
    expEl.className = `explanation ${isCorrect ? "correct" : "wrong"}`;

    document.getElementById("btn-next").disabled = false;
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex < this.allQuestions.length) {
      this.renderQuestion();
    } else {
      this.showResult();
    }
  }

  showResult() {
    const total = this.answers.length;
    const correctCount = this.answers.filter(a => a.correct).length;
    const score = Math.round((correctCount / total) * 100);
    const level = LEVEL_THRESHOLDS.find(t => score >= t.min);

    document.getElementById("result-score").textContent = `${score}点`;
    document.getElementById("result-correct").textContent = `${correctCount} / ${total} 問正解`;
    document.getElementById("result-level").textContent = level.label;
    document.getElementById("result-level").style.color = level.color;
    document.getElementById("result-level-bar").style.width = `${score}%`;
    document.getElementById("result-level-bar").style.background = level.color;
    document.getElementById("result-desc").textContent = level.desc;

    this.renderCategoryBreakdown();
    this.renderWrongAnswers();

    this.showScreen("result");
    window.scrollTo(0, 0);
  }

  renderCategoryBreakdown() {
    const catStats = {};
    Object.values(CATEGORIES).forEach(cat => {
      catStats[cat] = { correct: 0, total: 0 };
    });

    this.answers.forEach(a => {
      const cat = a.question.category;
      catStats[cat].total++;
      if (a.correct) catStats[cat].correct++;
    });

    const container = document.getElementById("category-breakdown");
    container.innerHTML = "";

    Object.entries(catStats).forEach(([cat, stat]) => {
      if (stat.total === 0) return;
      const pct = Math.round((stat.correct / stat.total) * 100);
      const bar = document.createElement("div");
      bar.className = "cat-row";
      bar.innerHTML = `
        <div class="cat-label">
          <span>${cat}</span>
          <span class="cat-score">${stat.correct}/${stat.total}</span>
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width:${pct}%; background:${this.pctColor(pct)}"></div>
        </div>
      `;
      container.appendChild(bar);
    });
  }

  pctColor(pct) {
    if (pct >= 80) return "#10b981";
    if (pct >= 50) return "#f59e0b";
    return "#ef4444";
  }

  renderWrongAnswers() {
    const wrongs = this.answers.filter(a => !a.correct);
    const container = document.getElementById("wrong-answers");
    const section = document.getElementById("wrong-section");

    if (wrongs.length === 0) {
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    container.innerHTML = "";

    wrongs.forEach(a => {
      const q = a.question;
      const card = document.createElement("div");
      card.className = "wrong-card";
      card.innerHTML = `
        <div class="wrong-card-header">
          <span class="badge">${q.category}</span>
          <span class="badge level-${this.levelClass(q.level)}">${q.level}</span>
        </div>
        <p class="wrong-question">${q.question}</p>
        <p class="wrong-your-answer">あなたの回答: <span class="text-wrong">${q.choices[a.selected]}</span></p>
        <p class="wrong-correct-answer">正解: <span class="text-correct">${q.choices[q.answer]}</span></p>
        <p class="wrong-explanation">💡 ${q.explanation}</p>
      `;
      container.appendChild(card);
    });
  }

  restart() {
    this.allQuestions = [...questions].sort(() => Math.random() - 0.5);
    this.startQuiz();
  }
}

document.addEventListener("DOMContentLoaded", () => new QuizApp());
