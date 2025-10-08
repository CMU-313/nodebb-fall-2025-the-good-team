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

Please navigate to each section to read about the implementation details and the related tests.

## Role Group Registeration 

### How to use?
The user has a choice to select their role when registering for an account. Upon navigating to the register user screen, there is a dropdown box for "Role" that we implemented. The dropdown include "Student" and "Instructor" choices, which should correspond to the role of the user. 

Once the account is created, the user will be put in the associated group. 

### How to test?

We can verify that the user is actually created into their respective role group by navigating to the group tab in NodeBB, selecting the respective role that the user registered for, and verifying that their name appears there.

### Automated testing

The automated testing can be found in lines 59-104 of visibility_test.js

The test simulates Group registration by registering one instructor and one student. The accompanying User Id's (uids) of the instructor and student are stored and will be used for visibility selection testing that follows. The try-catch setup makes sure that the rest of the test suite will not run if the registration is unsuccessful ( the block will fail if the instructor account is not registered and added to Instructor group successfully and student account is not successfully registered and added to Student group). 

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

The automated testing can be found in lines 107-200 of visibility_test.js

This test checks the dropdown input is being processed properly. A visibility key is captured when a selection that is not 'everyone' occurs. If the user selects 'all-instructors' or 'user:UID' (which indicates a specific intructor for this case) the test navigates to the post's edit page and reads the saved uid from the vibility dropdown. An assertion is then run to check the saved value is 'all-instructors' or a specific user/instructor. 

The second part is an output check where the test checks that a user whose uid is not included in the post's authorized viewer list. The test reads the page body and asserts whether content is missing or if text is visible (correctness is determined if their uid is present or not) A uid included in the authorized viewer list will be tested on being able to view said post, but a uid not included in the authorized viewer list should correctly be denied access/ see nothing. This test is run on both instructors and students. 

File path:
> test/custom_tests/visibility_tests.js

## Post Visiblity Alert

### How to use?

This feature shows a confirmation of what visibility choice the user selected when the user submit the post. There is an alert on the bottom right of the screen. The alert will indicate the visibility choice according to what the user chose. This will help user verifies that they did actually target the right group of audience when posting.

### How to test?

Post a post and select the respective visibility option. Observe the notification alert at the bottom right screen that will appear for ~5 seconds. It should say the visibility option you chose.

### Automated testing

The automated testing can be found at lines ...

The test does ...

File path:
> test/custom_tests/


## Post Notification Preview

### How to use?

This feature shows a preview of a message when the recepient is mentioned in a post. Instead of showing the "[User] Mentioned you" in the notificiation, we get to see a preview of the message instead. 

To use this feature, simply use the @ to specify which user to mention. This will come in handy when posting an instructor only post or replying to a particular post.

### How to test?

Use the @ to mention a specific user in one account. Login to the account that is mentioned and see that you can see the notification.

### Automated testing

The automated testing can be found at lines ... 

The test does ...

File path:
> test/custom_tests/


## Post visibility tag

### How to use?
This feature marks the post with the corresponding visibility tag that the post was selected with. In the "Comments & Feedback" section, the posts with instructor-only or a specific instructor will have a tag next to the title to indicate the visibility of the post.

This feature doesn't require any user aciton, and is an additional feature added to enhance the visibility selection to help instructors distinguish public from private posts.

### How to test?

This can be tested by posting a post under "Comments & Feedback" and observe the tag next to the title in the main topic list screen. This will show up only if the post visibility is selected as instructor only or targeted towards a specific instructor.

### Automated testing

The automated testing can be found in the badgetemplate.js test file

The test verifies the correct behavior by simulating a post with the respective visibility tag. For post with instrutor only, the test verifies that there is a corresponding instructor only tag next to the title in the html render. The specific instructor case is similar. For the post that is public, there is no tag, and the test verifies this.

File path:
> test/custom_tests/badgetemplate.js

## Endorsement Response


### How to use?


### How to test?



### Automated testing

The automated testing can be found visibility test at lines ... 

The test does ...

File path:
> test/custom_tests/visibility_tests


## Post visibility toggle

### How to use?


### How to test?



### Automated testing

The automated testing can be found visibility test at lines ... 

The test does ...

File path:
> test/custom_tests/visibility_tests
