/** Exercise the same trusted activation carried by the React Sources panel. */
exports.openSourceFromControl = async function openSourceFromControl(page, url, title = "") {
  const testId = "aegis-test-open-source";
  await page.evaluate(({ url, title, testId }) => {
    document.getElementById(testId)?.remove();
    const button = document.createElement("button");
    button.id = testId;
    button.type = "button";
    button.textContent = "Open test source";
    button.style.cssText = "position:fixed;bottom:4px;left:4px;z-index:2147483647";
    button.addEventListener("click", (activation) => {
      window.dispatchEvent(new CustomEvent("aegis-open-source-window", { detail: { url, title, activation } }));
      button.remove();
    });
    document.body.append(button);
  }, { url, title, testId });
  await page.locator("#" + testId).click();
};
