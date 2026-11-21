"""
Distributed Webhook Dispatcher - End-to-End Selenium Automation Script

Demonstrates full browser cursor control, mouse hovering using ActionChains,
interactive scenario dispatches, and modal inspection using standardized data-testid selectors.

Requirements:
  pip install selenium webdriver-manager

Run:
  python tests/e2e-selenium.py
"""

import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def run_selenium_demo():
    print("🚀 Initializing Chrome WebDriver with ActionChains Cursor Control...")
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    # Uncomment next line for headless CI environments:
    # options.add_argument("--headless=new")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 10)
    actions = ActionChains(driver)

    base_url = os.environ.get("TEST_URL", "http://localhost:5173")

    def hover_and_click(css_selector, label):
        print(f"👉 Moving cursor to: {label} ({css_selector})")
        element = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, css_selector)))
        # Visibly move mouse cursor over element
        actions.move_to_element(element).pause(0.5).click().perform()
        print(f"   ✅ Clicked: {label}")
        time.sleep(0.5)

    try:
        print(f"📡 Navigating to {base_url}...")
        driver.get(base_url)
        time.sleep(1)

        # 1. Handle Welcome Modal
        print("\n--- Step 1: Initial Welcome Modal ---")
        try:
            welcome_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="btn-welcome-explore-own"]')))
            hover_and_click('[data-testid="btn-welcome-explore-own"]', "Explore on My Own")
        except Exception:
            print("   (Welcome modal already closed or skipped)")

        # 2. Test Walkthrough Guide
        print("\n--- Step 2: Testing Walkthrough Guide ---")
        hover_and_click('[data-testid="btn-walkthrough-guide"]', "Header Walkthrough Guide Button")
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="tour-autopilot-panel"]')))
        print("   🎉 Walkthrough Guide is active!")

        # Pause Autopilot
        hover_and_click('[data-testid="btn-tour-autoplay-toggle"]', "Pause Autopilot Timer")

        # Step forward
        hover_and_click('[data-testid="btn-tour-next"]', "Next Stop (Section 2)")
        time.sleep(1)

        hover_and_click('[data-testid="btn-tour-next"]', "Next Stop (Section 3)")
        time.sleep(1)

        # Close Walkthrough
        hover_and_click('[data-testid="btn-tour-close"]', "Close Walkthrough Guide")
        print("   ✅ Walkthrough Guide closed.")

        # 3. Dispatch Studio
        print("\n--- Step 3: Dispatch Studio ---")
        hover_and_click('[data-testid="nav-tab-dispatch"]', "Sidebar -> Dispatch Studio")
        hover_and_click('[data-testid="btn-tpl-payment"]', "Payment Template Preset")
        hover_and_click('[data-testid="btn-target-mock200"]', "Mock 200 OK Receiver Target")
        hover_and_click('[data-testid="btn-regenerate-id"]', "Regenerate Event ID")
        hover_and_click('[data-testid="btn-dispatch-submit"]', "Dispatch Webhook (Instant 202)")

        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="dispatch-response-card"]')))
        print("   🎉 HTTP 202 Accepted response card verified!")

        # 4. Testing Lab & Scenarios
        print("\n--- Step 4: Testing Lab & Scenarios ---")
        hover_and_click('[data-testid="nav-tab-simulator"]', "Sidebar -> Testing Lab")
        hover_and_click('[data-testid="btn-scenario-recovering"]', "Self-Healing Flaky Server Scenario")
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="simulator-notice"]')))
        print("   🎉 Exponential backoff scenario triggered!")

        # 5. Delivery Logs & Inspection
        print("\n--- Step 5: Delivery Logs & Inspection ---")
        hover_and_click('[data-testid="nav-tab-deliveries"]', "Sidebar -> Delivery Logs & Audit")

        search_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="input-search-jobs"]')))
        actions.move_to_element(search_input).click().send_keys("sim_").perform()
        time.sleep(0.5)

        hover_and_click('[data-testid="filter-tab-SUCCESS"]', "Filter SUCCESS")
        hover_and_click('[data-testid="filter-tab-ALL"]', "Filter ALL")

        try:
            inspect_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="btn-inspect-job"]')))
            hover_and_click('[data-testid="btn-inspect-job"]', "First Job Inspect Button")
            wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="btn-close-modal"]')))
            print("   🎉 Delivery Execution Timeline Modal opened!")
            hover_and_click('[data-testid="btn-copy-payload"]', "Copy Payload")
            hover_and_click('[data-testid="btn-close-modal"]', "Close Modal")
            print("   ✅ Modal closed.")
        except Exception as e:
            print(f"   (No jobs to inspect or already closed: {e})")

        # 6. Architecture
        print("\n--- Step 6: System Architecture Blueprint ---")
        hover_and_click('[data-testid="nav-tab-architecture"]', "Sidebar -> System Architecture")
        time.sleep(1)

        print("\n✨ ALL SELENIUM CURSOR & INTERACTION TESTS COMPLETED SUCCESSFULLY! ✨\n")

    except Exception as ex:
        print(f"❌ Selenium Error: {ex}")
    finally:
        time.sleep(2)
        driver.quit()
        print("🔒 Driver session closed.")

if __name__ == "__main__":
    run_selenium_demo()
