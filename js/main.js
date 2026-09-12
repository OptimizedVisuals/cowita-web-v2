/* =========================================================
   CoWiTa — Shared Site JavaScript
   ---------------------------------------------------------
   Responsibilities:
   - Mobile navigation
   - Header dropdowns
   - Header scroll state
   - Smooth anchor scrolling
   - Reveal animations
   - Current year
   - Footer accordion
   - Footer legacy-link normalization
   - Escape-key handling

   Header dropdowns use native <details>/<summary>.
   Footer sections use native <button> controls with
   aria-expanded / aria-controls.
   ========================================================= */

(function () {
  "use strict";


  /* =========================================================
     CONFIG
     ========================================================= */

  const MOBILE_BREAKPOINT = 900;
  const FOOTER_ACCORDION_BREAKPOINT = 650;
  const HEADER_SCROLL_THRESHOLD = 20;


  /* =========================================================
     DOM READY
     ========================================================= */

  function initSite() {
    initMobileNavigation();
    initDropdownNavigation();
    initHeaderScrollState();
    initSmoothScrolling();
    initRevealAnimations();
    initCurrentYear();
    initFooterAccordion();
    initFooterLegacyLinks();
    initEscapeKeyHandling();
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSite);
  } else {
    initSite();
  }


  /* =========================================================
     SHARED HELPERS
     ========================================================= */

  function getSiteHeader() {
    return document.querySelector(".site-header");
  }


  function getNavigation() {
    const header = getSiteHeader();

    if (!header) {
      return null;
    }

    const nav = header.querySelector(".nav-links");

    const menuToggle = header.querySelector(".menu-toggle");

    const dropdownGroups = Array.from(
      header.querySelectorAll(".nav-group")
    );

    return {
      header,
      nav,
      menuToggle,
      dropdownGroups
    };
  }


  function isModifiedClick(event) {
    return (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    );
  }


  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  function initMobileNavigation() {
    const navigation = getNavigation();

    if (!navigation) {
      return;
    }

    const {
      header,
      nav,
      menuToggle
    } = navigation;


    if (!nav || !menuToggle) {
      return;
    }


    /* -------------------------------------------------------
       Ensure correct navigation relationship
       ------------------------------------------------------- */

    const navigationId =
      nav.id || "primary-navigation";

    nav.id = navigationId;

    menuToggle.setAttribute(
      "aria-controls",
      navigationId
    );


    /* -------------------------------------------------------
       Close mobile navigation
       ------------------------------------------------------- */

    function closeMenu() {
      header.classList.remove("nav-open");
      nav.classList.remove("is-open");

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Open navigation"
      );
    }


    /* -------------------------------------------------------
       Open mobile navigation
       ------------------------------------------------------- */

    function openMenu() {
      header.classList.add("nav-open");
      nav.classList.add("is-open");

      menuToggle.setAttribute(
        "aria-expanded",
        "true"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Close navigation"
      );
    }


    /* -------------------------------------------------------
       Toggle mobile navigation
       ------------------------------------------------------- */

    function toggleMenu() {
      const isOpen =
        header.classList.contains("nav-open");

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }


    /* -------------------------------------------------------
       Initial state
       ------------------------------------------------------- */

    closeMenu();


    /* -------------------------------------------------------
       Menu button
       ------------------------------------------------------- */

    menuToggle.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        toggleMenu();
      }
    );


    /* -------------------------------------------------------
       Close after normal navigation link
       ------------------------------------------------------- */

    nav.querySelectorAll("a").forEach(
      function (link) {

        link.addEventListener(
          "click",
          function (event) {

            /*
             * Preserve browser behaviour for:
             * - Ctrl/Cmd click
             * - Shift click
             * - Alt click
             * - middle/new-tab behaviour
             * - downloads
             * - target="_blank"
             */
            if (
              isModifiedClick(event) ||
              link.hasAttribute("download") ||
              link.target === "_blank"
            ) {
              return;
            }

            closeMenu();
            closeAllDropdowns();
          }
        );

      }
    );


    /* -------------------------------------------------------
       Close when returning to desktop
       ------------------------------------------------------- */

    function handleResize() {
      if (
        window.innerWidth > MOBILE_BREAKPOINT
      ) {
        closeMenu();
      }
    }


    window.addEventListener(
      "resize",
      handleResize,
      { passive: true }
    );


    /*
     * Expose internal helper so other site systems,
     * including Escape handling and smooth scrolling,
     * can close the same navigation.
     */
    header.__cowitaCloseMenu = closeMenu;
  }


  /* =========================================================
     DROPDOWN NAVIGATION
     ========================================================= */

  function initDropdownNavigation() {
    const navigation = getNavigation();

    if (!navigation) {
      return;
    }

    const {
      header,
      dropdownGroups
    } = navigation;


    if (!dropdownGroups.length) {
      return;
    }


    /* -------------------------------------------------------
       Make close function available if needed elsewhere
       ------------------------------------------------------- */

    window.closeCowitaDropdowns =
      closeAllDropdowns;


    /* -------------------------------------------------------
       Setup each dropdown
       ------------------------------------------------------- */

    dropdownGroups.forEach(
      function (group) {

        const summary =
          group.querySelector(
            ":scope > summary"
          );

        if (!summary) {
          return;
        }


        /*
         * Native <details> controls its own open state.
         * This listener only ensures one dropdown is open
         * at a time.
         */
        group.addEventListener(
          "toggle",
          function () {

            if (!group.open) {
              return;
            }


            dropdownGroups.forEach(
              function (otherGroup) {

                if (
                  otherGroup !== group &&
                  otherGroup.open
                ) {
                  otherGroup.removeAttribute(
                    "open"
                  );
                }

              }
            );

          }
        );


        /* ---------------------------------------------------
           Escape closes this dropdown
           --------------------------------------------------- */

        summary.addEventListener(
          "keydown",
          function (event) {

            if (event.key !== "Escape") {
              return;
            }

            event.preventDefault();
            event.stopPropagation();

            group.removeAttribute("open");

            summary.focus();
          }
        );


        /* ---------------------------------------------------
           Dropdown links
           --------------------------------------------------- */

        group.querySelectorAll("a").forEach(
          function (link) {

            link.addEventListener(
              "click",
              function (event) {

                if (
                  isModifiedClick(event) ||
                  link.hasAttribute("download") ||
                  link.target === "_blank"
                ) {
                  return;
                }

                group.removeAttribute("open");
              }
            );

          }
        );

      }
    );


    /* -------------------------------------------------------
       Click outside header
       ------------------------------------------------------- */

    document.addEventListener(
      "click",
      function (event) {

        if (
          header.contains(event.target)
        ) {
          return;
        }

        closeAllDropdowns();
      }
    );
  }


  /* =========================================================
     CLOSE ALL DROPDOWNS
     ========================================================= */

  function closeAllDropdowns() {
    document
      .querySelectorAll(
        ".site-header .nav-group[open]"
      )
      .forEach(
        function (group) {

          group.removeAttribute("open");

        }
      );
  }


  /* =========================================================
     HEADER SCROLL STATE
     ========================================================= */

  function initHeaderScrollState() {
    const header = getSiteHeader();

    if (!header) {
      return;
    }


    let ticking = false;


    function updateHeader() {

      if (
        window.scrollY >
        HEADER_SCROLL_THRESHOLD
      ) {
        header.classList.add(
          "is-scrolled"
        );
      } else {
        header.classList.remove(
          "is-scrolled"
        );
      }

      ticking = false;
    }


    function requestHeaderUpdate() {

      if (ticking) {
        return;
      }

      window.requestAnimationFrame(
        updateHeader
      );

      ticking = true;
    }


    updateHeader();


    window.addEventListener(
      "scroll",
      requestHeaderUpdate,
      {
        passive: true
      }
    );
  }


  /* =========================================================
     SMOOTH ANCHOR SCROLLING
     ========================================================= */

  function initSmoothScrolling() {

    const links =
      document.querySelectorAll(
        'a[href^="#"]'
      );


    if (!links.length) {
      return;
    }


    links.forEach(
      function (link) {

        link.addEventListener(
          "click",
          function (event) {

            /*
             * Preserve modified clicks.
             */
            if (
              isModifiedClick(event)
            ) {
              return;
            }


            const href =
              link.getAttribute("href");


            /*
             * Ignore empty anchors.
             */
            if (
              !href ||
              href === "#"
            ) {
              return;
            }


            let target = null;


            /*
             * Prevent malformed selectors from
             * breaking the rest of the JS.
             */
            try {
              target =
                document.querySelector(
                  href
                );
            } catch (error) {
              return;
            }


            if (!target) {
              return;
            }


            event.preventDefault();


            /*
             * Close navigation before scrolling.
             */
            closeMobileNavigation();
            closeAllDropdowns();


            const header =
              getSiteHeader();


            const headerHeight =
              header
                ? header.offsetHeight
                : 0;


            const targetPosition =
              target.getBoundingClientRect()
                .top +
              window.scrollY -
              headerHeight -
              20;


            window.scrollTo({
              top: Math.max(
                targetPosition,
                0
              ),
              behavior:
                getScrollBehavior()
            });


            /*
             * Allow keyboard users to focus the
             * destination without moving the page.
             */
            if (
              !target.hasAttribute(
                "tabindex"
              )
            ) {
              target.setAttribute(
                "tabindex",
                "-1"
              );
            }


            window.setTimeout(
              function () {

                target.focus({
                  preventScroll: true
                });

              },
              100
            );

          }
        );

      }
    );
  }


  /* =========================================================
     CLOSE MOBILE NAVIGATION
     ========================================================= */

  function closeMobileNavigation() {

    const header =
      getSiteHeader();


    if (!header) {
      return;
    }


    header.classList.remove(
      "nav-open"
    );


    const nav =
      header.querySelector(
        ".nav-links"
      );


    if (nav) {
      nav.classList.remove(
        "is-open"
      );
    }


    const menuToggle =
      header.querySelector(
        ".menu-toggle"
      );


    if (menuToggle) {

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Open navigation"
      );

    }
  }


  /* =========================================================
     SCROLL BEHAVIOUR
     ========================================================= */

  function getScrollBehavior() {

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


    return reducedMotion
      ? "auto"
      : "smooth";
  }


  /* =========================================================
     REVEAL ANIMATIONS
     ========================================================= */

  function initRevealAnimations() {

    const revealElements =
      document.querySelectorAll(
        ".reveal"
      );


    if (!revealElements.length) {
      return;
    }


    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


    /* -------------------------------------------------------
       Reduced motion
       ------------------------------------------------------- */

    if (reducedMotion) {

      revealElements.forEach(
        function (element) {

          element.classList.add(
            "is-visible"
          );

          element.classList.remove(
            "is-hidden"
          );

        }
      );

      return;
    }


    /* -------------------------------------------------------
       IntersectionObserver
       ------------------------------------------------------- */

    if (
      "IntersectionObserver" in window
    ) {

      const observer =
        new IntersectionObserver(
          function (
            entries,
            observerInstance
          ) {

            entries.forEach(
              function (entry) {

                if (
                  !entry.isIntersecting
                ) {
                  return;
                }


                entry.target.classList.add(
                  "is-visible"
                );


                entry.target.classList.remove(
                  "is-hidden"
                );


                observerInstance.unobserve(
                  entry.target
                );

              }
            );

          },
          {
            threshold: 0.12,
            rootMargin:
              "0px 0px -40px 0px"
          }
        );


      revealElements.forEach(
        function (element) {

          /*
           * Content starts visible by default in CSS.
           * JavaScript explicitly enables the hidden
           * state before observing it.
           */
          element.classList.add(
            "is-hidden"
          );

          observer.observe(
            element
          );

        }
      );


      return;
    }


    /* -------------------------------------------------------
       Fallback
       ------------------------------------------------------- */

    revealElements.forEach(
      function (element) {

        element.classList.add(
          "is-visible"
        );

        element.classList.remove(
          "is-hidden"
        );

      }
    );
  }


  /* =========================================================
     CURRENT YEAR
     ========================================================= */

  function initCurrentYear() {

    const yearElements =
      document.querySelectorAll(
        "[data-current-year]"
      );


    if (!yearElements.length) {
      return;
    }


    const currentYear =
      new Date().getFullYear();


    yearElements.forEach(
      function (element) {

        element.textContent =
          currentYear;

      }
    );
  }


  /* =========================================================
     FOOTER ACCORDION
     ---------------------------------------------------------
     Desktop:
       - All footer sections remain open.
       - Links remain visible.
       - Toggle icons are hidden by CSS.

     Mobile:
       - All sections start collapsed.
       - Clicking a heading opens/closes its links.
       - aria-expanded stays synchronized.
       - CSS changes + to − automatically.

     The HTML already uses:
       <button class="footer-group-toggle"
               aria-expanded="false"
               aria-controls="...">

       <div class="footer-group-links">
     ========================================================= */

  function initFooterAccordion() {

    const footer =
      document.querySelector(".site-footer");


    if (!footer) {
      return;
    }


    const toggles =
      Array.from(
        footer.querySelectorAll(
          ".footer-group-toggle"
        )
      );


    if (!toggles.length) {
      return;
    }


    /* -------------------------------------------------------
       Find controlled panel
       ------------------------------------------------------- */

    function getControlledPanel(toggle) {

      const panelId =
        toggle.getAttribute(
          "aria-controls"
        );


      if (!panelId) {
        return null;
      }


      /*
       * getElementById is safer than querySelector
       * because IDs can theoretically contain characters
       * that have special meaning in CSS selectors.
       */
      return document.getElementById(
        panelId
      );
    }


    /* -------------------------------------------------------
       Set accordion state
       ------------------------------------------------------- */

    function setFooterGroupState(
      toggle,
      expanded
    ) {

      const panel =
        getControlledPanel(toggle);


      if (!panel) {
        return;
      }


      toggle.setAttribute(
        "aria-expanded",
        String(expanded)
      );


      /*
       * The CSS controls visual visibility through
       * aria-expanded, so we intentionally do not
       * use the hidden attribute here.
       *
       * This allows the desktop CSS to keep all groups
       * permanently visible.
       */
      panel.classList.toggle(
        "is-open",
        expanded
      );
    }


    /* -------------------------------------------------------
       Synchronize footer with viewport
       ------------------------------------------------------- */

    function syncFooterAccordion() {

      const isMobile =
        window.innerWidth <=
        FOOTER_ACCORDION_BREAKPOINT;


      toggles.forEach(
        function (toggle) {

          /*
           * Desktop:
           * Everything is permanently expanded.
           */
          if (!isMobile) {
            setFooterGroupState(
              toggle,
              true
            );

            return;
          }


          /*
           * Mobile:
           * Start collapsed unless the user has already
           * interacted with this group.
           *
           * On a breakpoint transition from desktop to
           * mobile we deliberately collapse everything.
           */
          setFooterGroupState(
            toggle,
            false
          );

        }
      );
    }


    /* -------------------------------------------------------
       Toggle handler
       ------------------------------------------------------- */

    toggles.forEach(
      function (toggle) {

        /*
         * Make sure aria-controls points to a real
         * panel if the HTML already provides the ID.
         */
        const panel =
          getControlledPanel(toggle);


        if (!panel) {
          return;
        }


        toggle.addEventListener(
          "click",
          function () {

            /*
             * Footer accordion behaviour only exists
             * on mobile. Desktop sections stay open.
             */
            if (
              window.innerWidth >
              FOOTER_ACCORDION_BREAKPOINT
            ) {
              return;
            }


            const isExpanded =
              toggle.getAttribute(
                "aria-expanded"
              ) === "true";


            setFooterGroupState(
              toggle,
              !isExpanded
            );

          }
        );

      }
    );


    /* -------------------------------------------------------
       Initial state
       ------------------------------------------------------- */

    syncFooterAccordion();


    /* -------------------------------------------------------
       Responsive state
       ------------------------------------------------------- */

    let resizeTimer = null;


    window.addEventListener(
      "resize",
      function () {

        window.clearTimeout(
          resizeTimer
        );


        resizeTimer =
          window.setTimeout(
            function () {
              syncFooterAccordion();
            },
            100
          );

      },
      {
        passive: true
      }
    );


    /*
     * Expose helper for Escape-key handling.
     */
    footer.__cowitaSyncAccordion =
      syncFooterAccordion;


    footer.__cowitaCloseAccordion =
      function () {

        toggles.forEach(
          function (toggle) {

            setFooterGroupState(
              toggle,
              false
            );

          }
        );

      };
  }


  /* =========================================================
     FOOTER LEGACY LINK NORMALIZATION
     ---------------------------------------------------------
     The existing footer contains older Stories URLs.

     This allows the shared JS to correct them at runtime
     without requiring the same HTML change across every
     page.
     ========================================================= */

  function initFooterLegacyLinks() {

    const footer =
      document.querySelector(".site-footer");


    if (!footer) {
      return;
    }


    const redirects = {
      "/stories/featured.html":
        "/stories/featured-stories.html",

      "/stories/participant-stories.html":
        "/stories/participants.html",

      "/stories/journeys.html":
        "/stories/journey.html",

      "/stories/news.html":
        "/stories/news-updates.html"
    };


    footer
      .querySelectorAll("a[href]")
      .forEach(
        function (link) {

          const href =
            link.getAttribute("href");


          if (!href) {
            return;
          }


          /*
           * Only rewrite exact internal paths.
           *
           * Query strings and hash fragments are preserved.
           */
          const urlParts =
            href.split(/([?#].*)/);


          const basePath =
            urlParts[0];


          const suffix =
            urlParts[1] || "";


          const correctedPath =
            redirects[basePath];


          if (!correctedPath) {
            return;
          }


          link.setAttribute(
            "href",
            correctedPath + suffix
          );

        }
      );
  }


  /* =========================================================
     ESCAPE KEY HANDLING
     ========================================================= */

  function initEscapeKeyHandling() {

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key !== "Escape"
        ) {
          return;
        }


        /*
         * Close header dropdowns first.
         */
        closeAllDropdowns();


        /*
         * Close mobile navigation.
         */
        closeMobileNavigation();


        /*
         * Close open footer sections on mobile.
         */
        const footer =
          document.querySelector(
            ".site-footer"
          );


        if (
          footer &&
          typeof footer.__cowitaCloseAccordion ===
            "function"
        ) {

          footer.__cowitaCloseAccordion();

        }

      }
    );
  }


})();