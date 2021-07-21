const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');

const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors')


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('please upload an image file'));
        }
        cb(undefined, true);
    }
});
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
   try {
       const buffer = await sharp(req.file.buffer).resize({ width: 250, height:250 }).png().toBuffer();
       req.user.avatar = buffer;
       await req.user.save();
       res.send();
   } catch (error) {
       res.status(500).send(error);
   }
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth, async(req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error)
    }
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);
    } catch (error) {
        
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredential(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);

        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send()
    } 
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();

    } catch (error) {
        res.status(500).send();
    }
});

// Create user
router.post('/users', cors(),async (req, res) => {

    const user = new User(req.body);
    // user.save().then(user => {
    //     res.status(201).send(user);
    // }).catch(error => {
    //     res.status(400).send(error);
    // });

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }

});

// Read users
router.get('/users/me', auth, async (req, res) => {

    // try {
    //     const users = await User.find({});
    //     res.send(users);
    // } catch (error) {
    //     res.status(500).send();
    // }

    res.send(req.user);
});

// Read user
router.get('/users/:id', async (req, res) => {

    const _id = req.params.id;
    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(500).send();
    }

});

// Update user
// router.patch('/users/:id', async (req, res) => {
//     const updates = Object.keys(req.body);
//     const validUpdates = ['name', 'password', 'email', 'age'];
//     const isValid = updates.every(update => {
//         return validUpdates.includes(update);
//     });

//     if (!isValid) {
//         return res.status(400).send('error: invalid updates!');
//     }

//     try {
//         // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
//         const user = await User.findById(req.params.id);

//         updates.forEach(update => user[update] = req.body[update]);
//         await user.save();

//         if (!user) {
//             return res.status(404).send();
//         }
//         res.send(user);
//     } catch (error) {
//         res.status(400).send();
//     }
// });

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const validUpdates = ['name', 'password', 'email', 'age'];
    const isValid = updates.every(update => {
        return validUpdates.includes(update);
    });

    if (!isValid) {
        return res.status(400).send('error: invalid updates!');
    }

    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        // const user = await User.findById(req.params.id);

        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete user
// router.delete('/users/:id', async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id);
//         if (!user) {
//             return res.status(404).send();
//         }
//         res.send(user);
//     } catch (error) {
//         res.status(500).send();
//     }
// });
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (error) {
        res.status(500).send();
    }
})

module.exports = router;