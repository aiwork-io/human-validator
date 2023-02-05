# Human Validator
Human Validator App

There are 4 packages. 
annotator-business
annotator-user
annotator-validator
annotator-app

The first 3 packages contain front end code that is unique to each classification of account (business, user, validator).
- The user is a normal user, who will be tasked with labelling images.
- The business user is a requestor, that has uploaded images for labelling purposes (these are the images that the user will be tasked).
- The validator is a special type of admin user, that has the rights to decide correctly, which image has the right label.  Once this has been done, the process cannot be reversed.  As a result, the front end code does not allow any registration.  The administrator has to separately go to the database table corresponding to that particular account to trigger the code.  Future revision may include functionality to register as a validator (via invitation link generated).

The last package contains the backend code that is written in Javascript.  Each of the front end code will interact with the backend code.
