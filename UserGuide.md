# UserGuide for The Good Team's Implementation

## Setup
1. ./nodebb setup
2. **./nodebb activate nodebb-plugin-role-groups**
3. ./nodebb start

This will activate our custom plugin that creates the instructor and student groups. Please verify that the groups exists in the group tab of NodeBB, else the implemetation doesn't work. In that case, you need to use the Admin Control Panel to create "students" and "instructors" groups manually.

The implementation will be centered around the "Comments & Feedback" section in NodeBB. We expect that page to serve as our Q&A forum.

## Implemented Features
1. Role Group Registeration
2. Post visibility selection
3. Post Notification Preview
4. Post visibility tag
5. Endorsement Response
6. Post visibility toggle

Please navigate to each section to read about the implementation details and the related tests.

## Role Group Registeration 

### How to use?
The user has a choice to select their role when registering for an account. Upon navigating to the register user screen, there is a dropdown box for "Role" that we implemented. The dropdown include "Student" and "Instructor" choices, which should correspond to the role of the user. 

Once the account is created, the user will be put in the associated group. 

### How to test?

We can verify that the user is actually created into their respective role group by navigating to the group tab in NodeBB, selecting the respective role that the user registered for, and verifying that their name appears there.

### Automated testing

The automated testing can be found visibility test at lines ... 

The test does ...

File path:
> test/custom_tests/visibility_tests


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

The automated testing can be found visibility test at lines ... 

The test does ...

File path:
> test/custom_tests/visibility_tests.js

## Post Notification Preview

### How to use?

This feature shows a preview of a message when the recepient is mentioned in a post. Instead of showing the "[User] Mentioned you" in the notificiation, we get to see a preview of the message instead. 

To use this feature, simply use the @ to specify which user to mention. This will come in handy when posting an instructor only post or replying to a particular post.

### How to test?

Use the @ to mention a specific user in one account. Login to the account that is mentioned and see that you can see the notification.

### Automated testing

The automated testing can be found visibility test at lines ... 

The test does ...

File path:
> test/custom_tests/visibility_tests.js


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
