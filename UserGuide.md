# UserGuide for The Good Team's Implementation

## Setup
1. ./nodebb setup
2. **./nodebb activate nodebb-plugin-role-groups**
3. ./nodebb start

This will activate our custom plugin that creates the instructor and student groups. Please verify that the groups exists in the group tab of NodeBB, else the implemetation doesn't work. In that case, you need to use the Admin Control Panel to create "students" and "instructors" groups manually.

The implementation will be centered around the "Comments & Feedback" section in NodeBB. We expect that page to serve as our Q&A forum.

## Implemented Features
1. Role Group Registration
2. Post visibility selection
3. Post visiblity Alert
4. Post Notification Preview
5. Post visibility tag
6. Endorsement Response
7. Post visibility toggle

Please navigate to each section to read about the implementation details and the related tests. Each feature has multiple tests to insure sufficent coverage of their basic implementiation, this is further explained below. 

## Role Group Registeration 

### How to use?
The user has a choice to select their role when registering for an account. Upon navigating to the register user screen, there is a dropdown box for "Role" that we implemented. The dropdown include "Student" and "Instructor" choices, which should correspond to the role of the user. 

Once the account is created, the user will be put in the associated group. 

### How to test?

We can verify that the user is actually created into their respective role group by navigating to the group tab in NodeBB, selecting the respective role that the user registered for, and verifying that their name appears there.

### Automated testing

The automated testing can be found in lines 5-20 of visibility_test.js

Most of the testing for the visibility function tests the actual logic of who is restricted to posts, but the canViewPost function to set up these tests verifies the dropdown logic implemented. Lines 5-20 check that dependent upon user selection- the correct user role is established and the uid is stored as a viewer of said post. 

File path:
> test/custom_tests/visibility_tests.js


## Post visibility selection

### How to use?

When creating a topic under "Comments & Feedback" section, there is a dropdown box next to the writing tools. The dropdown should have a default value of "Everyone". The user can selects their post visibility by selecting the options from the dropdown.

- Everyone: Everyone can see the  post
- Instrucor only: All users with the role instructor can see the post & the author
- Specific instructor: Only that instructor can see the post

Note: the specific instructor section lists all users in the database in the instructor role group.

### How to test?

The user can create a post and select the visibility accordingly. Then, login to another account and observe the respective visibility choice that they chose. For example, if student1 posted a instructor-only post, loggin in to any instructor accounts will be able to see the post, but student2 won't be able to see the post.


### Automated testing

The automated testing can be found in lines 34-78 of visibility_test.js

This test confirms that the visibility restrictions chosen from the dropdown are applied correctly and that only specified users are able to view posts. Tests 1-2 and their subtests verify that within students are not able to see posts sent to specific instructors or 'all instructors' and instructors are not able to see posts that are sent to another instructor. The 3rd test verifies that both students and instructors are able to see a post if it is marked to be viewable by 'everyone' 

File path:
> test/custom_tests/visibility_tests.js

## Post Visiblity Alert

### How to use?

This feature shows a confirmation of what visibility choice the user selected when the user submit the post. There is an alert on the bottom right of the screen. The alert will indicate the visibility choice according to what the user chose. This will help user verifies that they did actually target the right group of audience when posting.

### How to test?

Post a post and select the respective visibility option. Observe the notification alert at the bottom right screen that will appear for ~5 seconds. It should say the visibility option you chose.

### Automated testing

The automated testing can be found at lines 26-65 of alertvisibility.js

The test is a unit testing suite comprised of 5 tests. Tests 1-3 handle the specific visibility constraints and checks that the correct alert specifying the group posted to is displayed. For example, the second test checks that in the event a post is marked for 'all-instructors,' the appropriate "Posted only to all instructors" is displayed in the alert box. The 4th and 5th tests check that when a specific visibility or user is not specified as a recipient of the post, then the generic "post successfully submitted" alert is displayed. 

File path:
> test/custom_tests/alertvisibility.js


## Post Notification Preview

### How to use?

This feature shows a preview of a message when the recepient is mentioned in a post. Instead of showing the "[User] Mentioned you" in the notificiation, we get to see a preview of the message instead. 

To use this feature, simply use the @ to specify which user to mention. This will come in handy when posting an instructor only post or replying to a particular post.

### How to test?

Use the @ to mention a specific user in one account. Login to the account that is mentioned and see that you can see the notification.

### Automated testing

The automated testing can be found at lines 30-72 of notifpreview.js 

The test handles 5 different scenarios for the notification preview logic dependent on the length of the message. For context, users are now able to preview their message in the notifications dropdown, but this preview only shows the first four words of the message. Tests 1-2 handle this check and ensure that messages over four words display the first four words and then an ellipses (...) to show there is more to the message, and messages with exactly four words or under are displayed as is. Test 4 also applies for shorter messages and makes sure there are no additional punctuation edits to messages under four words. Test 3 verifies the removal of HTML tags in the preview and Test 5 ensures that an empty message will display nothing in the preview as well. 

File path:
> test/custom_tests/notifpreview.js


## Post visibility tag

### How to use?
This feature marks the post with the corresponding visibility tag that the post was selected with. In the "Comments & Feedback" section, the posts with instructor-only or a specific instructor will have a tag next to the title to indicate the visibility of the post.

This feature doesn't require any user action, and is an additional feature added to enhance the visibility selection to help instructors distinguish public from private posts.

### How to test?

This can be tested by posting a post under "Comments & Feedback" and observe the tag next to the title in the main topic list screen. This will show up only if the post visibility is selected as instructor only or targeted towards a specific instructor.

### Automated testing

The automated testing can be found in the badgetemplate.js test file

The test verifies the correct behavior by simulating a post with the respective visibility tag. For post with instrutor only, the test verifies that there is a corresponding instructor only tag next to the title in the html render. The specific instructor case is similar. For the post that is public, there is no tag, and the test verifies this.

File path:
> test/custom_tests/badgetemplate.js


## Endorsement Response

This feature allows users to show upvotes another user's post. If a post has a positive amount of upvotes, a "Good" (1-2), "Very Helpful"(3-5), or "High"(6+) tag will show up beside the post, showing users what posts are of high quality. 

### How to use?
Log in as a registered user. Navigate the to "Comments and Feedback" category. Navigate to any post and press the upvote button. If the post previously had no upvotes, pressing the upvote button will trigger the "Good" tag to show up. If the post previously had 2 upvotes, pressing the upvote button will trigger the "Very Helpful" tag to show up. If the post previously had 5 upvotes, pressing the upvote button will trigger the "High" tag to show up.



### How to test?

The automated testing can be found in the endorsement_tests.js test file
This set of tests validates the logic that determines the badge level based on the total number of upvotes a post has received. First, tt verifies that 1 or 2 upvotes map to the "Good" badge level. Second, it verifies that 3, 4, or 5 upvotes map to the "Very Helpful" badge level. Lastly, it verifies that 6 or more upvotes (up to 100+) map to the highest badge level, "High". 

File path:
> test/custom_tests/endorsement_tests.js


### Automated testing

The automated testing can be found on line 44-92 the endorsement_tests.js test file.

This test suite verifies the behavior of the endorsement feature. It first tests the logic that maps the number of upvotes to an endorsement level, ensuring that zero or negative upvotes return "none", 1–2 upvotes return "good", 3–5 upvotes return "very-helpful", and 6 or more upvotes return "high". The suite then tests the logic of updating post endorsements, confirming that a badge is shown when a post has positive upvotes and removed when upvotes are zero.

File path:
> test/custom_tests/endorsement_tests.js


## Post visibility toggle

### How to use?

This feature creates a button that is only visible to instructors on the bottom of a post. This button either says “Make Private” or “Make Public” depending on the post's current visibility settings. Pressing this button will change the visibility of the post and trigger an alert to remind the instructor of the change. 

### How to test?

Log in as an instructor and click on a student post and then click the button. An alert should appear in the bottom right hand corner of the screen confirming the change. To further test this though, you can log out and check if the post is still visible. If it was previously public, clicking the button should mean the post is no longer visible. 


### Automated testing

The automated testing can be found on lines 78-129  in the visibility_toggle.js test file.

This test suite verifies the full integration between the post visibility toggle button’s user interface and backend logic. It has 4 tests. The first one ensures that clicking the button correctly emits a socket event. The second and third test check that button text and visibility get changed. These tests also ensure the appropriate success alert messages are being displayed. The last test is an error-handling test to confirm that any server error triggers an alert without causing a crash.

File path:
> test/custom_tests/visibility_toggle.js
