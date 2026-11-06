Ponder.registry((e) => {
    e.create("vinery:grapevine_pot").scene("grapevine_pot_scene", "Juicing grapes", (scene, util) => {

        scene.showBasePlate();

        scene.world.setBlocks([2, 1, 2], "vinery:grapevine_pot");
        scene.world.showSection([2, 1, 2], Facing.DOWN);
        
        scene.idle(10);

        scene.text(80, "The Grapevine Pot can be filled with a max of 6 grapes of the same type", [2, 2, 2])

        scene.showControls(60, [2, 2, 2], "down").rightClick().withItem('vinery:red_grape')
        scene.idle(70);

        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "1").with("stage", "1"), false);
        scene.idle(5);
        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "3").with("stage", "2"), false);
        scene.idle(5);
        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "6").with("stage", "3"), false);
        scene.idle(70);

        scene.addLazyKeyframe();

        const armorStand = scene.world.createEntity("armor_stand", [2.5, 1, 2.5]);

        scene.text(80, "Once filled, jump on the grapes to turn them into juice", [2, 3, 2])

        scene.idle(20);

        for (let height = 1; height < 3; height = height + 0.07) {
            let h = height;
            scene.world.modifyEntity(armorStand, (e) => {
                e.setY(h);
            });
            scene.idle(1);
        }
        for (let height = 3; height > 1; height = height - 0.07) {
            let h = height;
            scene.world.modifyEntity(armorStand, (e) => {
                e.setY(h);
            });
            scene.idle(1);
        }
        scene.idle(20);
        scene.world.removeEntity(armorStand)
        scene.idle(20);

        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "6").with("stage", "4"), false);
        scene.idle(5);
        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "6").with("stage", "5"), false);
        scene.idle(5);
        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "6").with("stage", "6"), false);

        scene.idle(50);

        scene.addLazyKeyframe();
        
        scene.text(80, "You can then bottle the juice using empty wine bottles", [2, 2, 2])

        let selection = util.select.fromTo(2, 1, 2, 2, 1, 2)
        scene.overlay.showOutline(PonderPalette.GREEN, "fiveby", selection, 30)
        scene.showControls(60, [2, 2, 2], "down").rightClick().withItem('vinery:wine_bottle')

        scene.idle(70);

        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "3").with("stage", "1"), false);
        scene.idle(5);
        scene.world.modifyBlock([2, 1, 2], () => Block.id("vinery:grapevine_pot").with("type", "red").with("storage", "0").with("stage", "2"), false);

    });

});