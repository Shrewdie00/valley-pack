Ponder.registry((e) => {
    e.create('bakery:baker_station').scene("baker_station_scene_one", "Caking Baked Goods", (scene, util) => {

        scene.showStructure();
        scene.world.setBlocks([2, 1, 2], "bakery:baker_station");

        scene.idle(10);

        scene.text(80, "The Caking Station is the work table for preparing cakes, cookies, and cupcakes.")

        scene.idle(100);

        scene.addLazyKeyframe();

        scene.text(80, "To start, place cake dough on top of the station", [2, 2, 2])

        scene.idle(30);

        scene.showControls(35, [2, 3, 2], "down").rightClick().withItem('bakery:cake_dough')

        scene.idle(40);

        scene.world.setBlocks([2, 2, 2], "bakery:blank_cake", true);

        scene.idle(50);

        scene.addLazyKeyframe();
        
        scene.text(80, "To make cupcakes, any kind of knife can be used to cut the cake.", [2, 3, 2])

        scene.idle(30);

        scene.showControls(35, [2, 3, 2], "down").rightClick().withItem('bakery:bread_knife')

        scene.idle(40);

        scene.world.modifyBlock([2, 2, 2], () => Block.id("bakery:blank_cake").with("cake", false).with("cupcake", true), true);

        scene.idle(40);

        scene.addLazyKeyframe();
        
        scene.text(80, "For cookies, roll down the cupcake dough using a rolling pin.", [2, 3, 2])

        scene.idle(30);

        scene.showControls(35, [2, 3, 2], "down").rightClick().withItem('bakery:rolling_pin')

        scene.idle(40);

        scene.world.modifyBlock([2, 2, 2], () => Block.id("bakery:blank_cake").with("cake", false).with("cupcake", false).with("cookie", true), true);

        scene.idle(40);
        scene.world.hideSection([2, 1, 2], Facing.UP);
        scene.world.hideSection([2, 2, 2], Facing.UP);
        scene.world.hideSection([0, 1, 2], Facing.UP);
        scene.world.hideSection([4, 1, 2], Facing.UP);
        scene.world.hideSection([0, 2, 2], Facing.UP);
        scene.world.hideSection([0, 2, 2], Facing.UP);
        scene.idle(20);

        scene.addLazyKeyframe();
        
        scene.world.setBlocks([0, 1, 2], "bakery:baker_station");
        scene.world.showSection([0, 1, 2], Facing.DOWN);
        scene.world.setBlocks([4, 1, 2], "bakery:baker_station");
        scene.world.showSection([4, 1, 2], Facing.DOWN);
        scene.world.setBlocks([0, 2, 2], "bakery:blank_cake");
        scene.world.showSection([0, 2, 2], Facing.DOWN);
        scene.world.setBlocks([4, 2, 2], "bakery:blank_cake");
        scene.world.showSection([4, 2, 2], Facing.DOWN);
        scene.world.modifyBlock([0, 2, 2], () => Block.id("bakery:blank_cake").with("cake", false).with("cupcake", false).with("cookie", true), false);
        scene.world.modifyBlock([2, 2, 2], () => Block.id("bakery:blank_cake").with("cake", false).with("cupcake", true), false);
        scene.world.showSection([2, 1, 2], Facing.DOWN);
        scene.world.showSection([2, 2, 2], Facing.DOWN);
        
        scene.text(80, "Frosting can be added at any stage of the caking process.")

        scene.idle(50);

        scene.showControls(35, [2, 3, 2], "down").rightClick().withItem('bakery:strawberry_jam')

        scene.idle(40);

        scene.world.setBlocks([0, 2, 2], "bakery:strawberry_cookie_block", true);
        scene.world.setBlocks([2, 2, 2], "bakery:strawberry_cupcake_block", true);
        scene.world.setBlocks([4, 2, 2], "bakery:strawberry_cake", true);

        scene.idle(40);

        scene.addLazyKeyframe()     

        scene.text(80, "The cakes can then be harvested with an empty hand.", [2, 3, 2])

        scene.idle(30);

        scene.showControls(35, [2, 3, 2], "down").rightClick()

        scene.idle(40);

        scene.world.replaceBlocks([4, 2, 2], "air", true);
        scene.world.replaceBlocks([2, 2, 2], "air", true);
        scene.world.replaceBlocks([0, 2, 2], "air", true);

        const leftBlockPos = util.grid.at(4, 2, 2);
        const centerBlockPos = util.grid.at(2, 2, 2);
        const rightBlockPos = util.grid.at(0, 2, 2);

        const leftTop = util.vector.topOf(leftBlockPos);
        const centerTop = util.vector.topOf(centerBlockPos);
        const rightTop = util.vector.topOf(rightBlockPos);

        const cakeEntity = scene.world.createItemEntity(leftTop.add(0, 0.2, 0), util.vector.of(0.01, 0, 0), "bakery:strawberry_cake");
        const cupcakecakeEntity =scene.world.createItemEntity(centerTop.add(0, 0.2, 0), util.vector.of(0.01, 0, 0), "4x bakery:strawberry_cupcake");    
        const cookieEntity = scene.world.createItemEntity(rightTop.add(0, 0.2, 0), util.vector.of(0.01, 0, 0), "4x bakery:strawberry_glazed_cookie");

        scene.idle(60);
        scene.world.modifyEntity(cakeEntity, (e) => {
            e.discard();
        });
        scene.world.modifyEntity(cupcakecakeEntity, (e) => {
            e.discard();
        });
        scene.world.modifyEntity(cookieEntity, (e) => {
            e.discard();
        });
        scene.world.hideSection([2, 1, 2], Facing.UP);
        scene.world.hideSection([2, 2, 2], Facing.UP);
        scene.world.hideSection([0, 1, 2], Facing.UP);
        scene.world.hideSection([4, 1, 2], Facing.UP);
        scene.world.hideSection([0, 2, 2], Facing.UP);
        scene.world.hideSection([0, 2, 2], Facing.UP);
        scene.idle(20);

        scene.addLazyKeyframe()  

        scene.world.replaceBlocks([0, 1, 2], "air", false);
        scene.world.replaceBlocks([4, 1, 2], "air", false);
        scene.world.replaceBlocks([2, 1, 2], "bakery:iron_table", false);
        scene.world.setBlocks([2, 2, 2], "bakery:strawberry_cake", true);
        scene.world.showSection([2, 1, 2], Facing.DOWN);
        scene.world.showSection([2, 2, 2], Facing.DOWN);

        scene.text(80, "Cakes must be sliced before being eaten.", [2, 3, 2])

        scene.idle(30);

        scene.showControls(35, [2, 3, 2], "down").rightClick().withItem('bakery:bread_knife')

        scene.idle(40);

        scene.world.modifyBlock([2, 2, 2], () => Block.id("bakery:strawberry_cake").with("cuts", "1"), false);

        scene.world.createItemEntity(centerTop.add(0, 0.2, 0), util.vector.of(0.01, 0, 0), "bakery:strawberry_cake_slice");

        scene.idle(70);

    });

});