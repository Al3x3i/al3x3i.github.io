(function (window) {
  // Helper vars and functions.
  function extend(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
    return a;
  }

  // From https://davidwalsh.name/javascript-debounce-function.
  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  /**
   * PieceMaker obj.
   */
  function PieceMaker(el, options) {
    this.el = el;
    this.options = extend({}, this.options);
    extend(this.options, options);
    this._init();
  }

  /**
   * PieceMaker default options.
   */
  PieceMaker.prototype.options = {
    // Number of pieces / Layout (rows x cols).
    pieces: { rows: 14, columns: 10 },
    // Main image tilt: max and min angles.
    tilt: {
      maxRotationX: -2,
      maxRotationY: 3,
      maxTranslationX: 6,
      maxTranslationY: -2,
    },
  };

  /**
   * Init. Create layout and initialize/bind any events.
   */
  PieceMaker.prototype._init = function () {
    // The source of the main image.
    this.imgsrc = this.el.style.backgroundImage
      .replace("url(", "")
      .replace(")", "")
      .replace(/\"/gi, "");
    // Window sizes.
    this.win = { width: window.innerWidth, height: window.innerHeight };
    // Container sizes.
    this.dimensions = {
      width: this.el.offsetWidth,
      height: this.el.offsetHeight,
    };
    // Render all the pieces defined in the options.
    this._layout();

    // Init/Bind events
    this._initEvents();
  };

  /**
   * Renders all the pieces defined in the PieceMaker.prototype.options.
   */
  PieceMaker.prototype._layout = function () {
    this.el.style.backgroundImage = this.el.getAttribute("data-img-code");

    // Create the pieces and add them to the DOM (append it to the main element).
    this.pieces = [];
    for (let r = 0; r < this.options.pieces.rows; ++r) {
      for (let c = 0; c < this.options.pieces.columns; ++c) {
        const piece = this._createPiece(r, c);
        piece.style.backgroundPosition =
          -1 * c * 100 + "% " + -1 * 100 * r + "%";
        this.pieces.push(piece);
      }
    }
  };

  /**
   * Create a piece.
   */
  PieceMaker.prototype._createPiece = function (row, column) {
    const w = Math.round(this.dimensions.width / this.options.pieces.columns),
      h = Math.round(this.dimensions.height / this.options.pieces.rows),
      piece = document.createElement("div");

    piece.style.backgroundImage = "url(" + this.imgsrc + ")";
    piece.className = "piece";
    piece.style.width = w + "px";
    piece.style.height = h + +"px";
    piece.style.backgroundSize = w * this.options.pieces.columns + "px auto";
    piece.setAttribute("data-column", column);
    piece.setAttribute("data-delay", anime.random(-25, 25));
    this.el.appendChild(piece);
    this.el.style.width = w * this.options.pieces.columns + "px";
    this.el.style.height = h * this.options.pieces.rows + "px";

    return piece;
  };

  /**
   * Init/Bind Events.
   */
  PieceMaker.prototype._initEvents = function () {
    const self = this,
      // Window resize.
      debounceResizeFn = debounce(function () {
        self.win = { width: window.innerWidth, height: window.innerHeight };
        self.el.style.width = self.el.style.height = "";
        const elBounds = self.el.getBoundingClientRect();
        self.dimensions = { width: elBounds.width, height: elBounds.height };
        for (let i = 0, len = self.pieces.length; i < len; ++i) {
          const w = Math.round(
              self.dimensions.width / self.options.pieces.columns
            ),
            h = Math.round(self.dimensions.height / self.options.pieces.rows),
            piece = self.pieces[i];

          piece.style.width = w + "px";
          piece.style.height = h + "px";
          piece.style.backgroundSize =
            w * self.options.pieces.columns + "px auto";
          self.el.style.width = w * self.options.pieces.columns + "px";
          self.el.style.height = h * self.options.pieces.rows + "px";
        }
      }, 10);

    window.addEventListener("resize", debounceResizeFn);
  };

  /**
   * Animate the pieces.
   */
  PieceMaker.prototype.animatePieces = function (dir, callback) {
    const self = this;
    anime.remove(this.pieces);
    anime({
      targets: this.pieces.reverse(),
      duration: dir === "out" ? 600 : 500,
      delay: function (t, i) {
        return Math.max(0, i * 6 + parseInt(t.getAttribute("data-delay")));
      },
      easing: dir === "out" ? [0.2, 1, 0.3, 1] : [0.8, 1, 0.3, 1],
      translateX:
        dir === "out"
          ? function (t, i) {
              return t.getAttribute("data-column") <
                self.options.pieces.columns / 2
                ? anime.random(50, 100)
                : anime.random(-100, -50);
            }
          : function (t, i) {
              return t.getAttribute("data-column") <
                self.options.pieces.columns / 2
                ? [anime.random(50, 100), 0]
                : [anime.random(-100, -50), 0];
            },
      translateY:
        dir === "out"
          ? function (t, i) {
              return [0, anime.random(-1000, -800)];
            }
          : function (t, i) {
              return [anime.random(-1000, -800), 0];
            },
      opacity: {
        value: dir === "out" ? 0 : 1,
        duration: dir === "out" ? 600 : 300,
        easing: "linear",
      },
      complete: callback,
    });
  };

  /**
   * Custom effect on the pieces.
   */
  PieceMaker.prototype.fxCustom = function (dir) {
    this.fxCustomTriggered = true;
    const self = this;
    anime({
      targets: this.pieces.reverse().filter(function (t) {
        return t.getAttribute("data-column") < self.options.pieces.columns / 2;
      }),
      duration: dir === "left" ? 400 : 200,
      easing: dir === "left" ? [0.2, 1, 0.3, 1] : [0.8, 0, 0.7, 0],
      delay: function (t, i, c) {
        return dir === "left"
          ? Math.max(0, i * 5 + parseInt(t.getAttribute("data-delay")))
          : Math.max(
              0,
              (c - 1 - i) * 2 + parseInt(t.getAttribute("data-delay"))
            );
      },
      translateX: function (t, i) {
        return dir === "left"
          ? anime.random(-500, -100)
          : [anime.random(-500, -100), 0];
      },
      translateY: function (t, i) {
        return dir === "left"
          ? anime.random(0, 100)
          : [anime.random(0, 100), 0];
      },
      opacity: {
        duration: dir === "left" ? 200 : 200,
        value: dir === "left" ? 0 : [0, 1],
        easing: dir === "left" ? "linear" : [0.8, 0, 0.7, 0],
      },
    });
  };

  /**
   * Reset effect.
   */
  PieceMaker.prototype.fxCustomReset = function (dir, callback) {
    this.fxCustomTriggered = false;
    const self = this;
    anime.remove(this.pieces);
    anime({
      targets: this.pieces.reverse().filter(function (t) {
        return t.getAttribute("data-column") < self.options.pieces.columns / 2;
      }),
      duration: dir === "left" ? 200 : 400,
      easing: dir === "left" ? [0.8, 0, 0.7, 0] : [0.2, 1, 0.3, 1],
      delay: function (t, i, c) {
        return dir === "left"
          ? Math.max(
              0,
              (c - 1 - i) * 2 + parseInt(t.getAttribute("data-delay"))
            )
          : Math.max(0, i * 5 + parseInt(t.getAttribute("data-delay")));
      },
      translateX: function (t, i) {
        return dir === "left" ? 0 : anime.random(-500, -100);
      },
      translateY: function (t, i) {
        return dir === "left" ? 0 : anime.random(0, 100);
      },
      opacity: {
        duration: dir === "left" ? 200 : 200,
        value: dir === "left" ? 1 : [1, 0],
        easing: dir === "left" ? [0.8, 0, 0.7, 0] : "linear",
      },
      complete: callback,
    });
  };

  window.PieceMaker = PieceMaker;

  const DOM = {};
  let pm;
  DOM.body = document.body;
  DOM.loading = document.querySelector(".loading");

  DOM.pieces = document.querySelector(".pieces");
  DOM.glitchElems = document.querySelectorAll("[data-glitch]");
  DOM.contact = {
    el: document.querySelector(".contact-link"),
  };
  DOM.title = {
    el: document.querySelector(".title > .title__inner"),
  };
  DOM.menuCtrl = document.querySelector(".btn--menu");
  DOM.menu = {
    code: {
      wrapper: document.querySelector(".menu--code"),
      items: document.querySelectorAll(".menu--code > .menu__inner a"),
    },
  };
  DOM.overlay = document.querySelector(".overlay");

  let isAnimating;

  function init() {
    imagesLoaded(DOM.body, { background: true }, function () {
      // Remove page loader.
      DOM.loading.classList.add("loading--hide");
      // Create the image pieces.
      pm = new PieceMaker(DOM.pieces);
      // Start the squares loop effect on the main image.
      // pm.loopFx();
      // Glitch effect on some elements (title, contact and coder link) in the page.
      // gfx = new GlitchFx(DOM.glitchElems);
      // Split the title, contact and code menu items into spans/letters.
      wordsToLetters();
      // Init/Bind events
      initEvents();

      setTimeout(() => {
        switchMode();
      }, 1000);
    });
  }

  function wordsToLetters() {
    // Title.
    charming(DOM.title.el);
    DOM.title.letters = [].slice.call(DOM.title.el.querySelectorAll("span"));
    // Contact.
    charming(DOM.contact.el);
    DOM.contact.letters = [].slice.call(
      DOM.contact.el.querySelectorAll("span")
    );
    // Menu items (code mode).
    DOM.menuCodeItemLetters = [];
    [].slice.call(DOM.menu.code.items).forEach(function (item) {
      charming(item);
      DOM.menuCodeItemLetters.push(
        [].slice.call(item.querySelectorAll("span"))
      );
    });
  }

  function initEvents() {
    const contactMouseEnterEvFn = function (ev) {
        if (isAnimating) return false;
        pm.fxCustom("right");
      },
      contactMouseLeaveEvFn = function (ev) {
        if (isAnimating || !pm.fxCustomTriggered) return false;
        pm.fxCustomReset("right");
      };

    DOM.contact.el.addEventListener("mouseenter", contactMouseEnterEvFn);
    DOM.contact.el.addEventListener("mouseleave", contactMouseLeaveEvFn);
  }

  function switchMode() {
    if (isAnimating) {
      return false;
    }
    isAnimating = true;

    // mode: design||code.
    mode = "code";

    switchOverlay();

    // Switch the page content.
    switchToCode();

    // Animate the pieces.
    pm.animatePieces("out", function () {
      isAnimating = false;
    });
  }

  function switchToCode() {
    const showCode = function (target) {
      const el = DOM[target].el || DOM[target];

      if (target === "title" || target === "contact") {
        el.classList.remove("mode--design");
        el.classList.add("mode--code");
      }
      if (DOM[target].letters) {
        animateLetters(DOM[target].letters, "in", {
          begin: function () {
            DOM[target].el.style.opacity = 1;
            DOM[target].el.style.transform = "none";
          },
        });
      } else {
        el.style.opacity = 1;
        el.style.transform = "none";
      }
    };

    // Animate the title, contact, menu ctrl and menu items out and show the code mode version of these elements.
    // Title:
    showCode("title");

    // Contact:
    showCode("contact");

    // Menu ctrl:
    // showCode("menuCtrl");

    // Menu links:
    animateLetters(DOM.menuCodeItemLetters, "in", {
      delay: function (t, i) {
        return i * 30;
      },
      begin: function () {
        DOM.menu.code.wrapper.style.display = "block";
      },
    });
  }

  function switchOverlay() {
    anime.remove(DOM.overlay);
    anime({
      targets: DOM.overlay,
      duration: 800,
      easing: "linear",
      opacity: 1,
    });
  }

  function animateLetters(letters, dir, extraAnimeOpts) {
    let animeOpts = {};

    animeOpts.targets = letters;
    animeOpts.duration = 50;
    animeOpts.delay = function (t, i, c) {
      return dir === "in" ? i * 50 : (c - i - 1) * 50;
    };
    animeOpts.easing = dir === "in" ? "easeInQuint" : "easeOutQuint";
    animeOpts.opacity = dir === "in" ? [0, 1] : [1, 0];
    extend(animeOpts, extraAnimeOpts);

    anime.remove(animeOpts.targets);
    anime(animeOpts);
  }

  init();
})(window);
