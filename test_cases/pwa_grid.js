const APP_URL = "/mobile/app/admin/c355634c-42ca-4317-a086-3aeb4f750d8b";

// Console errors that mean the grid widget was not built:
//   "!! View[grid] not yet defined. Have an ABView instead:"
//   "ABViewCore:get datacollection(): View[grid] didn't define a dataviewID"
const BAD_CONSOLE = [/not yet defined/, /didn't define a dataviewID/];

// integration.cy.js swallows uncaught exceptions, so spy on console.error
// and check it ourselves.
function visitGrid() {
   cy.visit(`${APP_URL}?route=Item_Grid`, {
      onBeforeLoad(win) {
         cy.spy(win.console, "error").as("consoleError");
      },
   });
   cy.get("#app").should("exist");
}

function assertNoBadConsole() {
   cy.get("@consoleError").then((spy) => {
      const messages = spy
         .getCalls()
         .map((c) => c.args.map((a) => String(a?.message ?? a)).join(" "));
      BAD_CONSOLE.forEach((re) => {
         expect(
            messages.filter((m) => re.test(m)),
            `console.error matching ${re}`,
         ).to.have.length(0);
      });
   });
}

export default () => {
   describe("Grid", () => {
      it("renders without console errors", () => {
         visitGrid();
         cy.get(".page-content .data-table", { timeout: 10000 })
            .should("be.visible")
            .find("thead th")
            .should("have.length.at.least", 1);
         assertNoBadConsole();
      });

      it("shows a row added on item_list", () => {
         // seed a row with the same add form pwa_form.js uses
         cy.visit(`${APP_URL}?route=item_list`);
         cy.get("#app").should("exist");
         cy.get(".page-content").contains("add").first().click({ force: true });
         cy.get(".item-input").should("be.visible").first().click();
         cy.get(".item-label")
            .should("be.visible")
            .contains("add_form")
            .parent()
            .type("test_grid_row");
         cy.get(".button").contains("Save").first().click();
         cy.get(".item-title").contains("test_grid_row").should("be.visible");

         visitGrid();
         cy.get(".page-content .data-table tbody", { timeout: 10000 })
            .contains("td", "test_grid_row")
            .should("be.visible");
         assertNoBadConsole();
      });
   });
};
