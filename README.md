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

- Deploy application into IBM Cloud


## Prerequisites for Quiz conference owner

Conference owner need **1 PC** to have Quiz conference:

- PC for Operation, and for Screen Sharing if needed.


## Prerequisites for Quiz participant

Participant need **1 PC** and **1 smartphone**:

- PC to watch shared screen(Quiz).

- Smartphone for answering to quiz.



## How to use

- First, administrator need to access to /, signup if needed, log into system, and edit quiz and quizset.

  - See below how to edit quiz and quizset.

- It's optional, but we recommend you to input unique room name(like `yournameYYYYMMDD`) to prevent from network conjunction.

- Next, administrator click quizset id to browse /quizset page.

  - If you set room name, then you browse to /quizset?room=XXXX

  - If you want to peep parcitipants answers, use another PC and browse same URL.

- Then administrator may share this page into web conference, if needed.

- Then participant user attend web conference.

- At last, participant user may read its QR code with their smartphone, input his/her name, and answering board is shown in their smartphone screen.


## How to edit quiz and quizset

- `quiz` is single question. `quizset` is a series of program which contains one or more quiz.

- You can edit quiz. And you can edit quizset too.

- You can choose quiz category from foloowings:

  - General : It contains question text. You can include image URL too.

  - Zoomout : It contains question text. You have to include image URL too. In this category, participant would see zoomed image first, and it would be zoomed-out gradually.

  - 16 pieces : It contains question text. You have to include image URL too. In this category, participant would see 4x4 separated masked image first, and it would be unmasked gradually.

  - Blur : It contains question text. You have to include image URL too. In this category, participant would see blured image first, and it would be clear gradually.

  - Sound : It contains question text. You have to include mp3 sound URL too. In this category, participant can listen sound of that mp3 as a question or hint.

  - Video : It contains question text. You have to include video(mp4 or YouTube) URL too. In this category, participant can watch video as a question or hint.

- If you edit Sound or Video quiz, you need to setup your PC to share computer audio into Web conference.

  - https://oshierun.street-academy.com/entry/2020/04/19/211513

  - https://help.webex.com/ja-jp/nkhj2pcb/Use-the-Cisco-Webex-Desktop-App-to-Share-Your-Screen-with-a-Video-Device

- You can edit quizset. In quizset, you have to specify quiz ids as array([ 'xx1', 'xx2', .. ]).


## Copyright

2020 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.
