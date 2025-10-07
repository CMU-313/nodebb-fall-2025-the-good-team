const assert = require('assert');


const UNIQUE_ID = Date.now();
const INSTRUCTOR_EMAIL = `linear_instructor_${UNIQUE_ID}@test.com`;
const STUDENT_EMAIL = `linear_student_${UNIQUE_ID}@test.com`;
const PASSWORD = 'SecurePass123';
let instructorUID;
let studentUID; 
let restrictedPostUrl; 


async function login(page, email, password) {
	await page.goto('/login');
	await page.fill('#email', email);
	await page.fill('#password', password);
	await page.click('#login-button');
}

/**
 * Creates a new post with specified content and visibility.
 * The visibility key now supports UID enforcement (e.g., 'user:<uid>').
 * @param {string} visibilityKey - key will determine visibility: 'everyone', 'all_instructors', or 'user:<uid>'.
 */
async function createPost(page, content, visibilityKey) {
	console.log(`\t> Creating post with key: ${visibilityKey}`);
	await page.goto('/create-post');
	await page.fill('#post-content', content);
    
	await page.selectOption('#visibility-selector', { value: visibilityKey });
	await page.click('#submit-post-button');

	const postId = await page.url(); 
	return postId;
}

/**
 * Helper to get the UID after logging in and navigating to the profile page.
 * Assumes the UID is displayed in an element with ID 'user-id-display'.
 */
async function getUIDFromProfile(page) {
	await page.goto('/profile');
	const uidElement = page.locator('#user-id-display');
	
	await uidElement.waitFor({ state: 'visible', timeout: 10000 }); 
	const uid = await uidElement.innerText();
	return uid.trim();
}

//MAIN TESTS
async function runTests({ page }) {
	console.log('\n========================================================');
	console.log('STARTING LINEAR E2E TEST SCRIPT: UID ENFORCEMENT FOCUS');
	console.log('========================================================');
    
	let successCount = 0;
	let failureCount = 0;

	//Test that users are registered as either a student or Instructor
	try {
		console.log('\n--- SETUP: Registering Instructor & Capturing UID ---');
        
		// Register Instructor
		await page.goto('/register');
		await page.fill('#username', `Instructor-${UNIQUE_ID}`);
		await page.fill('#email', INSTRUCTOR_EMAIL);
		await page.fill('#password', PASSWORD);
		await page.fill('#confirm-password', PASSWORD);
		await page.click('#role-instructor');
		await page.click('#register-button');
		await page.waitForURL('/dashboard', { timeout: 30000 }); 
        
		// Capture UID after successful registration/login
		instructorUID = await getUIDFromProfile(page);
		console.log(`Instructor UID: ${instructorUID}`);

		console.log('--- SETUP: Registering Student & Capturing UID ---');

		// Register Student
		await page.goto('/register');
		await page.fill('#username', `Student-${UNIQUE_ID}`);
		await page.fill('#email', STUDENT_EMAIL);
		await page.fill('#password', PASSWORD);
		await page.fill('#confirm-password', PASSWORD);
		await page.click('#role-student');
		await page.click('#register-button');
		await page.waitForURL('/dashboard', { timeout: 30000 });

		// Capture UID after successful registration/login
		studentUID = await getUIDFromProfile(page);
		console.log(`Student UID: ${studentUID}`);

		// Log out
		await page.goto('/logout'); 
		console.log('--- SETUP COMPLETE: UIDs captured. ---');
        
		successCount += 2; // Count registration/setup steps as successful

	} catch (error) {
		console.error(`\n[FATAL ERROR] Setup failed. Cannot proceed with tests.`);
		console.error(`Error: ${error.message}`);
		console.log(`Verify the profile page shows the UID in an element with ID: #user-id-display`);
		return { successCount, failureCount: 1 };
	}


	//TEST 1: Verifying that Intructors are able to select who will see their post
	console.log('\n========================================');
	console.log('TEST GROUP 1: KEY PERSISTENCE');
	console.log('========================================');
    
	// 1.1 Test: 'all_instructors' is selectable
	const INSTRUCTOR_ONLY_CONTENT = 'Post for All Instructors (Key Test)';
	const INSTRUCTOR_ONLY_KEY = 'all_instructors';

	try {
		await login(page, INSTRUCTOR_EMAIL, PASSWORD);
        
		const postId = await createPost(page, INSTRUCTOR_ONLY_CONTENT, INSTRUCTOR_ONLY_KEY);
        
		// Navigate to edit page to check the saved value
		await page.goto(postId + '/edit'); 
		const selectedValue = await page.locator('#visibility-selector').inputValue();
        
		assert.strictEqual(selectedValue, INSTRUCTOR_ONLY_KEY, 'Test 1.1 FAILED: "all_instructors" key did not save correctly.');
		console.log('Test 1.1 PASS: "all_instructors" key saved successfully.');
		successCount++;

	} catch (error) {
		console.error(`Test 1.1 FAIL: ${error.message}`);
		failureCount++;
	}
    
	// 1.2 Test: 'user:<uid>'/Specific intructor is selectable
	const UID_RESTRICTED_CONTENT = 'UID Restricted Post: For Enforcement Test';
	const ENFORCEMENT_KEY = `user:${studentUID}`;

	try {
		await login(page, INSTRUCTOR_EMAIL, PASSWORD);
        
		// Create the enforcement post and store its URL
		restrictedPostUrl = await createPost(page, UID_RESTRICTED_CONTENT, ENFORCEMENT_KEY);
        
		// Navigate to edit page to check the saved value
		await page.goto(restrictedPostUrl + '/edit'); 
		const selectedValue = await page.locator('#visibility-selector').inputValue();
        
		assert.strictEqual(selectedValue, ENFORCEMENT_KEY, 'Test 1.2 FAILED: UID key did not save correctly.');
		console.log(`Test 1.2 PASS: UID key ${ENFORCEMENT_KEY} saved successfully.`);
		successCount++;
	} catch (error) {
		console.error(`Test 1.2 FAIL: ${error.message}`);
		failureCount++;
	}


	//TEST 2: Checking visibility: Restricted UID's are not collected and will not see the post
	console.log('\n========================================');
	console.log('TEST GROUP 2: UID ENFORCEMENT');
	console.log('========================================');

	try {
		// Test 2.1: Instructor (NOT the target UID) CANNOT see the post
		await login(page, INSTRUCTOR_EMAIL, PASSWORD);
		await page.goto(restrictedPostUrl);

		const postContent = await page.locator('body').innerText();
        
		// Assert: The page should contain an "Access Denied" message or NOT contain the post content
		const denialCheck = postContent.includes('Access Denied');
		const contentCheck = !postContent.includes(UID_RESTRICTED_CONTENT);

		assert(denialCheck || contentCheck, 'Test 2.1 FAILED: Instructor (not target UID) was able to view restricted post.');
		console.log('Test 2.1 PASS: Instructor correctly denied access.');
		successCount++;
        
	} catch (error) {
		console.error(`Test 2.1 FAIL: ${error.message}`);
		failureCount++;
	}

	try {
		// Test 2.2: Student (THE target UID) CAN see the post
		await login(page, STUDENT_EMAIL, PASSWORD);
		await page.goto(restrictedPostUrl);

		const postContent = await page.locator('body').innerText();
        
		// Assert: The post content MUST be present
		assert(postContent.includes(UID_RESTRICTED_CONTENT), 'Test 2.2 FAILED: Student (target UID) was NOT able to view restricted post.');
		console.log('Test 2.2 PASS: Student correctly granted access.');
		successCount++;
        
	} catch (error) {
		console.error(`Test 2.2 FAIL: ${error.message}`);
		failureCount++;
	}

	return { successCount, failureCount };
}


async function executeTests(args) {
	const results = await runTests(args);
	console.log('\n========================================================');
	console.log(`FINAL RESULTS: ${results.successCount} Successes, ${results.failureCount} Failures.`);
	console.log('========================================================');

	// If failures exist, throw an error 
	if (results.failureCount > 0) {
		throw new Error(`E2E Test Script failed with ${results.failureCount} assertion errors.`);
	}
}

module.exports = executeTests;
