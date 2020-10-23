# Qoodle

## Overview

Quiz platform, based on [Doodle Share](https://github.com/dotnsf/doodle_share/).


## Pre-requisite

- Public application server for Node.js

    - I would describe followings as you use IBM Cloud for this environment.


## Pre-requisite for IBM Cloud user

- Node.js runtime

- IBM Cloudant


## Install

- Download source from github.com

    - https://github.com/dotnsf/qoodle.git

- Edit settings.js with following information:

    - exports.db_username : username for IBM Cloudant

    - exports.db_password : password for IBM Cloudant

    - exports.admin_username : username for Basic Authenticate to access /quizset and /admin

    - exports.admin_password : password for Basic Authenticate to access /quizset and /admin

    - exports.defaultroom : default room name when not specified

- Deploy application into IBM Cloud


## Prerequisites for Quiz conference owner

Conference owner need **2 PCs** or **multi-monitor** to have Quiz conference:

- PC for Operation.

- PC for Screen Sharing.


## Prerequisites for Quiz participant

Participant need **1 PC** and **1 smartphone**:

- PC to watch shared screen(Quiz).

- Smartphone for answering to quiz.



## How to use

- First, administrator need to access to /admin, and edit quiz and quizset.

- Next, administrator click quizset id to browse /quizset page.

    - If you want to use room name, then set room field or access to /quizset?room=XXXX

- Then administrator may open /share(?room=XXXX) page **with different PC**, and share this screen into web conference.

- Then participant user attend web conference, and browse shared screen, that QR code is embedded.

- At last, participant user may read its QR code with their smartphone, input his/her name, and answering board is shown in their smartphone screen.



## Copyright

2020 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.
