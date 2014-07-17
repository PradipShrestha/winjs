// Copyright (c) Microsoft Open Technologies, Inc.  All Rights Reserved. Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.

(function () {
    "use strict";
    
    // Input: A list of fully qualified test names. e.g.:
    // ["WinJSTests.VerticalGridTests.testSetScrollPosition_VGrid_4X5X5"]
    // Output: A map of fully qualified module names to a map of test names to true. e.g.:
    // {
    //   "WinJSTests.VerticalGridTests": {
    //     "testSetScrollPosition_VGrid_4X5X5": true
    //   }
    // }
    function indexTests(tests) {
        var lookupTable = {};
        tests.forEach(function (fullTestName) {
            var parts = fullTestName.split(".");
            var fullModuleName = parts.slice(0, -1).join(".");
            var testName = parts[parts.length - 1];
            
            if (!lookupTable[fullModuleName]) {
                lookupTable[fullModuleName] = {};
            } 
            lookupTable[fullModuleName][testName] = true;
        });
        
        return lookupTable;
    }
    
    function disableTests(testsToRun) {
        var modulesTable = indexTests(testsToRun);
        
        var registerTestClass = LiveUnit.registerTestClass; 
        LiveUnit.registerTestClass = function (fullModuleName) {
            if (modulesTable[fullModuleName]) {
                var parts = fullModuleName.split(".");
                var moduleParentPath = parts.slice(0, -1);
                var moduleName = parts[parts.length - 1];
                var ModuleParent = moduleParentPath.reduce(function (current, name) {
                    return current && current[name];
                }, window);
                
                var isTestDisabled = modulesTable[fullModuleName];
                var Module = ModuleParent[moduleName];
                ModuleParent[moduleName] = function () {
                    Module.call(this);
                    for (var prop in this) {
                        if (isTestDisabled[prop]) {
                            delete this[prop];
                        }
                    }
                };
            }
            
            return registerTestClass(fullModuleName);
        };
    }
    
    disableTests([
        // Need to keep cell spanning and multisize tests in this list until Issue #416 is fixed
        
        "WinJSTests.CellSpanningGridLayoutTests.testAdjustedKeyForOrientationAndBarsWithCellspanningGridLayout",
        "WinJSTests.CellSpanningGridLayoutTests.testAsyncItemInfo",
        "WinJSTests.CellSpanningGridLayoutTests.testGapHandling",
        "WinJSTests.CellSpanningGridLayoutTests.testGetAdjacent",
        "WinJSTests.CellSpanningGridLayoutTests.testHitTest",
        "WinJSTests.CellSpanningGridLayoutTests.testInitialize",
        "WinJSTests.CellSpanningGridLayoutTests.testInvalidGroupInfoResult",
        "WinJSTests.CellSpanningGridLayoutTests.testInvalidItemInfo",
        "WinJSTests.CellSpanningGridLayoutTests.testLayout",
        "WinJSTests.CellSpanningGridLayoutTests.testLayoutParts",
        "WinJSTests.CellSpanningGridLayoutTests.testLayoutWhileInvisible",
        "WinJSTests.CellSpanningGridLayoutTests.testLayoutWithMargins",
        "WinJSTests.CellSpanningGridLayoutTests.testRemoveLastGroup",
        
        "WinJSTests.GroupListEditorTest.testChangeAtGroupBoundary_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testChangeAtGroupBoundary_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testChangeAtGroupBoundary_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testChangeAtGroupBoundary_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testChangeFirstItem_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testChangeFirstItem_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testChangeFirstItem_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testChangeFirstItem_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testChangeLastItem_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testChangeLastItem_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testChangeLastItem_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testChangeLastItem_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertAfter_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertAfter_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertAfter_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertAfter_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertAtEnd_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertAtEnd_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertAtEnd_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertAtEnd_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertAtStart_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertAtStart_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertAtStart_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertAtStart_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertBefore_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertBefore_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertBefore_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertBefore_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertOutsideOfRealizedRange_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertOutsideOfRealizedRange_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertOutsideOfRealizedRange_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertOutsideOfRealizedRange_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertToEmpty_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertToEmpty_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testInsertToEmpty_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testInsertToEmpty_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveAfter_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveAfter_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveAfter_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveAfter_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveBefore_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveBefore_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveBefore_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveBefore_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveToEnd_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveToEnd_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveToEnd_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveToEnd_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveToStart_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveToStart_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testMoveToStart_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testMoveToStart_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testRemoveAtGroupBoundary_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testRemoveAtGroupBoundary_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testRemoveAtGroupBoundary_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testRemoveAtGroupBoundary_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testRemoveFirstItem_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testRemoveFirstItem_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testRemoveFirstItem_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testRemoveFirstItem_normal_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testRemoveLastItem_multisize_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testRemoveLastItem_multisize_grouped_grid_TestDataSource",
        "WinJSTests.GroupListEditorTest.testRemoveLastItem_normal_grouped_grid_BindingList",
        "WinJSTests.GroupListEditorTest.testRemoveLastItem_normal_grouped_grid_TestDataSource",
        
        "WinJSTests.GroupedGridLayoutTests.testAsyncItemInfo",
        "WinJSTests.GroupedGridLayoutTests.testBackgroundLayout",
        "WinJSTests.GroupedGridLayoutTests.testGetAdjacentBetweenGroups",
        "WinJSTests.GroupedGridLayoutTests.testHitTest",
        "WinJSTests.GroupedGridLayoutTests.testInvalidUniformItemInfo",
        "WinJSTests.GroupedGridLayoutTests.testItemFromRange",
        "WinJSTests.GroupedGridLayoutTests.testLayoutClasses",
        "WinJSTests.GroupedGridLayoutTests.testUniformContainerSize",
        
        "WinJSTests.GroupsTests.testAdd",
        "WinJSTests.GroupsTests.testAddGroup",
        "WinJSTests.GroupsTests.testCustomGroupDataSource",
        "WinJSTests.GroupsTests.testDelete",
        "WinJSTests.GroupsTests.testDeleteAll",
        "WinJSTests.GroupsTests.testGroupFocusAfterDataSourceMutation",
        "WinJSTests.GroupsTests.testHeaderAbove",
        "WinJSTests.GroupsTests.testIndexOfFirstVisibleWithoutGroupMargins",
        "WinJSTests.GroupsTests.testIndexOfLastVisibleInLastColumnOfAGroup",
        "WinJSTests.GroupsTests.testLoadingStateAsync",
        "WinJSTests.GroupsTests.testLoadingStateEmpty",
        "WinJSTests.GroupsTests.testLoadingStateScrolling",
        "WinJSTests.GroupsTests.testLoadingStateSync",
        "WinJSTests.GroupsTests.testRealizeRenderAndResetDuringScrolling",
        "WinJSTests.GroupsTests.testReload",
        "WinJSTests.GroupsTests.testRequestGroupBeforeListViewReady",
        "WinJSTests.GroupsTests.testRtl",
        "WinJSTests.GroupsTests.testScrollLeft",
        "WinJSTests.GroupsTests.testScrollTo",
        "WinJSTests.GroupsTests.testSimpleLayout",
        "WinJSTests.GroupsTests.testSimpleLayoutAsyncDataSource",
        "WinJSTests.GroupsTests.testSimpleLayoutAsyncRenderer",
        "WinJSTests.GroupsTests.testSwitchingFromNoStructureNodesToStructureNodesWithGroups",
        
        "WinJSTests.HorizontalListTest.testEnsureVisible_HList_1X1X5",
        "WinJSTests.HorizontalListTest.testEnsureVisible_HList_1X2X3",
        "WinJSTests.HorizontalListTest.testEnsureVisible_HList_1X3X5",
        "WinJSTests.HorizontalListTest.testEnsureVisible_HList_1X5X3",
        "WinJSTests.HorizontalListTest.testGetIndexOfFirstLastVisible_HList_1X1X5",
        "WinJSTests.HorizontalListTest.testGetIndexOfFirstLastVisible_HList_1X2X3",
        "WinJSTests.HorizontalListTest.testGetIndexOfFirstLastVisible_HList_1X3X5",
        "WinJSTests.HorizontalListTest.testGetIndexOfFirstLastVisible_HList_1X5X3",
        "WinJSTests.HorizontalListTest.testGetScrollPosition_HList_1X1X5",
        "WinJSTests.HorizontalListTest.testGetScrollPosition_HList_1X2X3",
        "WinJSTests.HorizontalListTest.testGetScrollPosition_HList_1X3X5",
        "WinJSTests.HorizontalListTest.testGetScrollPosition_HList_1X5X3",
        "WinJSTests.HorizontalListTest.testSetIndexOfFirstVisible_HList_1X1X5",
        "WinJSTests.HorizontalListTest.testSetIndexOfFirstVisible_HList_1X2X3",
        "WinJSTests.HorizontalListTest.testSetIndexOfFirstVisible_HList_1X3X5",
        "WinJSTests.HorizontalListTest.testSetIndexOfFirstVisible_HList_1X5X3",
        "WinJSTests.HorizontalListTest.testSetScrollPosition_HList_1X1X5",
        "WinJSTests.HorizontalListTest.testSetScrollPosition_HList_1X2X3",
        "WinJSTests.HorizontalListTest.testSetScrollPosition_HList_1X3X5",
        "WinJSTests.HorizontalListTest.testSetScrollPosition_HList_1X5X3",
        
        "WinJSTests.LayoutTests.testAssureMarginRuleSpecificityDoesNotTrumpWin8",
        "WinJSTests.LayoutTests.testCancelationWithDefaultItemInfo",
        "WinJSTests.LayoutTests.testDefaultItemsContainerMargins",
        "WinJSTests.LayoutTests.testMeasuringContainerWithZeroSizedPlaceholder",
        "WinJSTests.LayoutTests.testSurfaceLength",
        
        "WinJSTests.LayoutTestsExtra.testCSSChange",
        "WinJSTests.LayoutTestsExtra.testChangeLayout",
        "WinJSTests.LayoutTestsExtra.testEnsureVisibleOutOfRangeGridLayout_GridLayout",
        "WinJSTests.LayoutTestsExtra.testEnsureVisibleWithAsymmetricalM   arginsInGridLayout_GridLayout",
        "WinJSTests.LayoutTestsExtra.testEnsureVisibleWithAsymmetricalMarginsInListLayout_ListLayout",
        "WinJSTests.LayoutTestsExtra.testFirstLastDisplayedInGridLayout_GridLayout",
        "WinJSTests.LayoutTestsExtra.testFirstLastDisplayedInListLayout_ListLayout",
        "WinJSTests.LayoutTestsExtra.testFirstVisibleInConstructor",
        "WinJSTests.LayoutTestsExtra.testHeightAutoLayoutGridLayout",
        "WinJSTests.LayoutTestsExtra.testHeightAutoLayoutListLayout",
        "WinJSTests.LayoutTestsExtra.testHorizontalGrid_GridLayout",
        "WinJSTests.LayoutTestsExtra.testIndexOfFirstVisible",
        "WinJSTests.LayoutTestsExtra.testIndexOfFirstVisibleGridLayouT_GridLayout",
        "WinJSTests.LayoutTestsExtra.testIndexOfFirstVisibleGridLayoutRTL_GridLayout",
        "WinJSTests.LayoutTestsExtra.testIndexOfFirstVisibleOutOfRangeGridLayout_GridLayout",
        "WinJSTests.LayoutTestsExtra.testLeadingMarginGridLayout_GridLayout",
        "WinJSTests.LayoutTestsExtra.testMaxRows_GridLayout",
        "WinJSTests.LayoutTestsExtra.testMaximumRowsOrColumnsHorizontal_CellSpanningLayout",
        "WinJSTests.LayoutTestsExtra.testMaximumRowsOrColumnsHorizontal_GridLayout",
        "WinJSTests.LayoutTestsExtra.testMaximumRowsOrColumnsVertical_GridLayout",
        "WinJSTests.LayoutTestsExtra.testMetrics",
        "WinJSTests.LayoutTestsExtra.testRecalculateItemPosition",
        "WinJSTests.LayoutTestsExtra.testRestoringScrollpos",
        "WinJSTests.LayoutTestsExtra.testScrollingSynchronization",
        "WinJSTests.LayoutTestsExtra.testSingleRealizationWithIndexOfFirstVisible",
        
        "WinJSTests.ListEditorTest.testDeleteWrapperSizeDuringAnimation",
        
        "WinJSTests.ListView.testFailDuringChangeWithNoLongerMeaningfulInMultisize",
        "WinJSTests.ListView.testFailDuringChangeWithNoResponseInMultisize",
        "WinJSTests.ListView.testFailDuringChangeWithNotPermittedInMultisize",
        "WinJSTests.ListView.testFailDuringInsertWithNoLongerMeaningfulInMultisize",
        "WinJSTests.ListView.testFailDuringInsertWithNoResponseInMultisize",
        "WinJSTests.ListView.testFailDuringInsertWithNotPermittedInMultisize",
        "WinJSTests.ListView.testFailDuringMoveWithNoLongerMeaningfulInMultisize",
        "WinJSTests.ListView.testFailDuringMoveWithNoResponseInMultisize",
        "WinJSTests.ListView.testFailDuringMoveWithNotPermittedInMultisize",
        "WinJSTests.ListView.testFailDuringRemoveWithNoLongerMeaningfulInMultisize",
        "WinJSTests.ListView.testFailDuringRemoveWithNoResponseInMultisize",
        "WinJSTests.ListView.testFailDuringRemoveWithNotPermittedInMultisize",
        "WinJSTests.ListView.testGetCount0FailsWithNoResponseInMultisize",
        "WinJSTests.ListView.testItemsFromIndex0FailsWithDoesNotExistInMultisize",
        "WinJSTests.ListView.testItemsFromIndex0FailsWithNoResponseInMultisize",
        "WinJSTests.ListView.testItemsFromIndex50FailsWithDoesNotExistInMultisize",
        "WinJSTests.ListView.testItemsFromIndex50FailsWithNoResponseInMultisize",
        "WinJSTests.ListView.testItemsFromIndex5FailsWithDoesNotExistInMultisize",
        "WinJSTests.ListView.testItemsFromIndex5FailsWithNoResponseInMultisize",
        "WinJSTests.ListView.testResizeDuringCellSpanningMeasuring",
        
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItemAfterResize",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_CellSpanningLayout_HeaderPositionLeft",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GridLayout_HeaderPositionLeft_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GridLayout_HeaderPositionLeft_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GridLayout_HeaderPositionTop_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GridLayout_HeaderPositionTop_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GridLayout_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GridLayout_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GroupedListLayout_HeaderPositionLeft_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GroupedListLayout_HeaderPositionLeft_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GroupedListLayout_HeaderPositionTop_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_GroupedListLayout_HeaderPositionTop_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_ListLayout_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_LTR_ListLayout_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_CellSpanningLayout_HeaderPositionLeft",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GridLayout_HeaderPositionLeft_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GridLayout_HeaderPositionLeft_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GridLayout_HeaderPositionTop_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GridLayout_HeaderPositionTop_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GridLayout_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GridLayout_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GroupedListLayout_HeaderPositionLeft_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GroupedListLayout_HeaderPositionLeft_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GroupedListLayout_HeaderPositionTop_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_GroupedListLayout_HeaderPositionTop_vertical_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_ListLayout_horizontal_",
        "WinJSTests.ListViewAnimation2Test.testPositioningOfDeletedItem_RTL_ListLayout_vertical_",
        
        "WinJSTests.ListViewEventsTest.testEvent_iteminvoked_Level0",
        "WinJSTests.ListViewEventsTest.testEvent_iteminvoked_Level2",
        "WinJSTests.ListViewEventsTest.testEvent_keyboardnavigating_Level0",
        "WinJSTests.ListViewEventsTest.testEvent_keyboardnavigating_Level2",
        "WinJSTests.ListViewEventsTest.testEvent_loadingstatechanged_Level0",
        "WinJSTests.ListViewEventsTest.testEvent_loadingstatechanged_Level2",
        "WinJSTests.ListViewEventsTest.testEvent_loadingstatechanged_NumItemsLoadedEventProperty_Level0",
        "WinJSTests.ListViewEventsTest.testEvent_loadingstatechanged_NumItemsLoadedEventProperty_Level2",
        "WinJSTests.ListViewEventsTest.testEvent_selectionchanged_Level0",
        "WinJSTests.ListViewEventsTest.testEvent_selectionchanged_Level2",
        "WinJSTests.ListViewEventsTest.testEvent_selectionchanging_Level0",
        "WinJSTests.ListViewEventsTest.testEvent_selectionchanging_Level2",
        
        "WinJSTests.MultisizeTests.testAddCellSpanningLayout",
        "WinJSTests.MultisizeTests.testAddGridLayout",
        "WinJSTests.MultisizeTests.testBigGroupCellSpanningLayout",
        "WinJSTests.MultisizeTests.testChangeCellSpanningLayout",
        "WinJSTests.MultisizeTests.testCrossGroupNavigationCellSpanningLayout",
        "WinJSTests.MultisizeTests.testDownUpKeysCellSpanningLayout",
        "WinJSTests.MultisizeTests.testFirstVisibleInConstructorCellSpanningLayout",
        "WinJSTests.MultisizeTests.testGapHandlingCellSpanningLayout",
        "WinJSTests.MultisizeTests.testLayoutCellSpanningLayout",
        "WinJSTests.MultisizeTests.testLayoutCellSpanningLayoutAsync",
        "WinJSTests.MultisizeTests.testLayoutGridLayout",
        "WinJSTests.MultisizeTests.testLayoutGridLayoutAsync",
        "WinJSTests.MultisizeTests.testLayoutOccupancyMapCellSpanningLayout",
        "WinJSTests.MultisizeTests.testLayoutOccupancyMapGridLayout",
        "WinJSTests.MultisizeTests.testLayoutWithMarginsCellSpanningLayout",
        "WinJSTests.MultisizeTests.testLayoutWithMarginsGridLayout",
        "WinJSTests.MultisizeTests.testMeasureAfterReadySignal",
        "WinJSTests.MultisizeTests.testMixedLayoutCellSpanningLayout",
        "WinJSTests.MultisizeTests.testMixedLayoutGridLayout",
        "WinJSTests.MultisizeTests.testPageUpPageDownKeysCellSpanningLayout",
        "WinJSTests.MultisizeTests.testRemoveCellSpanningLayout",
        "WinJSTests.MultisizeTests.testRemoveGridLayout",
        "WinJSTests.MultisizeTests.testReplaceCellSpanningLayout",
        "WinJSTests.MultisizeTests.testReplaceGridLayout",
        "WinJSTests.MultisizeTests.testRightLeftKeysCellSpanningLayout",
        "WinJSTests.MultisizeTests.testUnevenMixedLayoutCellSpanningLayout",
        "WinJSTests.MultisizeTests.testUnevenMixedLayoutGridLayout",
        
        "WinJSTests.UniformGridLayoutTests.testGetAdjacent",
        "WinJSTests.UniformGridLayoutTests.testInitialize_horizontal",
        "WinJSTests.UniformGridLayoutTests.testInitialize_null",
        "WinJSTests.UniformGridLayoutTests.testInitialize_vertical",
        "WinJSTests.UniformGridLayoutTests.testItemFromRange",
        "WinJSTests.UniformGridLayoutTests.testLayoutWhileInvisible",
        "WinJSTests.UniformGridLayoutTests.testLayout_horizontal",
        "WinJSTests.UniformGridLayoutTests.testLayout_null",
        "WinJSTests.UniformGridLayoutTests.testLayout_vertical",
        
        "WinJSTests.VirtualizedViewTests.testAddingItemToTheEndOfListWhileLastItemHadFocusDoesNotLoseFocus",
        "WinJSTests.VirtualizedViewTests.testAnimationDuringSezoZoomingAndchange",
        "WinJSTests.VirtualizedViewTests.testAnimationDuringSezoZoomingAndremove",
        "WinJSTests.VirtualizedViewTests.testAnimationInViewportPendingFlagFalse",
        "WinJSTests.VirtualizedViewTests.testAnimationInViewportPendingFlagTrue",
        "WinJSTests.VirtualizedViewTests.testAnimationsInterface",
        "WinJSTests.VirtualizedViewTests.testAriaWorkerCancellation",
        "WinJSTests.VirtualizedViewTests.testAsynchronousLayoutsDoNotRunConcurrently",
        "WinJSTests.VirtualizedViewTests.testBackdropClass",
        "WinJSTests.VirtualizedViewTests.testChangedRange",
        "WinJSTests.VirtualizedViewTests.testChangedRangeDuringAsyncContainerCreation",
        "WinJSTests.VirtualizedViewTests.testChangedRangeForDeleteAll",
        "WinJSTests.VirtualizedViewTests.testClickOnContainer",
        "WinJSTests.VirtualizedViewTests.testCompleteEventOnReloadForHightZeroFollowedByResize",
        "WinJSTests.VirtualizedViewTests.testDatasourceChangeDuringAsyncLayout",
        "WinJSTests.VirtualizedViewTests.testDeferContainerCreationUntilSeZoZoomCompletes",
        "WinJSTests.VirtualizedViewTests.testDeferRealizationOnDelete",
        "WinJSTests.VirtualizedViewTests.testDeferRealizationOnDeleteNotJustDeletes",
        "WinJSTests.VirtualizedViewTests.testDeferRealizationOnDeleteWithDataModificationsDuringAnimation",
        "WinJSTests.VirtualizedViewTests.testDeferUnrealizingUntilSeZoZoomCompletes",
        "WinJSTests.VirtualizedViewTests.testDeleteAnimationStartsBeforeUpdateTreeIsDone",
        "WinJSTests.VirtualizedViewTests.testDeleteDoesNotLoseFocusRectangle",
        "WinJSTests.VirtualizedViewTests.testDeleteWhileFocusIsOnLastItemDoesNotLoseFocus",
        "WinJSTests.VirtualizedViewTests.testDomTrimBlocksAcrossGroups",
        "WinJSTests.VirtualizedViewTests.testDomTrimCollapsePartOfGroup",
        "WinJSTests.VirtualizedViewTests.testDomTrimCollapseWholeGroup",
        "WinJSTests.VirtualizedViewTests.testDomTrimFirstBlockInGroup",
        "WinJSTests.VirtualizedViewTests.testDomTrimGroupOverlapDuringScroll",
        "WinJSTests.VirtualizedViewTests.testDomTrimInMiddleOfBlock",
        "WinJSTests.VirtualizedViewTests.testDomTrimInMiddleOfTwoBlocks",
        "WinJSTests.VirtualizedViewTests.testDomTrimNoGroupOverlapDuringScroll",
        "WinJSTests.VirtualizedViewTests.testDomTrimOneBlock",
        "WinJSTests.VirtualizedViewTests.testDomTrimOneBlockWithGroup",
        "WinJSTests.VirtualizedViewTests.testDomTrimSecondBlock",
        "WinJSTests.VirtualizedViewTests.testDomTrimSimpleScroll",
        "WinJSTests.VirtualizedViewTests.testDomTrimensureVisibleWithoutMove",
        "WinJSTests.VirtualizedViewTests.testEditDuringAsyncLayout",
        "WinJSTests.VirtualizedViewTests.testEditsDonotCreateAllContainers",
        "WinJSTests.VirtualizedViewTests.testEditsDonotCreateAllContainersWithGroupsWithStructureNodes",
        "WinJSTests.VirtualizedViewTests.testEditsDonotCreateAllContainersWithStructureNodes",
        "WinJSTests.VirtualizedViewTests.testEditsDuringLazyCreation",
        "WinJSTests.VirtualizedViewTests.testEnsureVisibleAfterDataChange",
        "WinJSTests.VirtualizedViewTests.testGetAdjactentWait",
        "WinJSTests.VirtualizedViewTests.testGetItemPosition",
        "WinJSTests.VirtualizedViewTests.testGroupedInitialization",
        "WinJSTests.VirtualizedViewTests.testGroupedTreeUpdate",
        "WinJSTests.VirtualizedViewTests.testGroupedTreeUpdateWithStructureNodes",
        "WinJSTests.VirtualizedViewTests.testInitalization",
        "WinJSTests.VirtualizedViewTests.testInsertItemWithDeferredUnrealizedNonAnimatedItems",
        "WinJSTests.VirtualizedViewTests.testInsertionsDuringLazyContainerCreation",
        "WinJSTests.VirtualizedViewTests.testInsertsAnimationStartsBeforeRealizationIsDone",
        "WinJSTests.VirtualizedViewTests.testLayoutIsCalledForChangesToRealizedAndUnRealizedItems",
        "WinJSTests.VirtualizedViewTests.testLayoutSite",
        "WinJSTests.VirtualizedViewTests.testLayoutWrapper",
        "WinJSTests.VirtualizedViewTests.testLazyFlatTreeCreation",
        "WinJSTests.VirtualizedViewTests.testLazyGroupedTreeCreationWithBigGroups",
        "WinJSTests.VirtualizedViewTests.testLazyGroupedTreeCreationWithSmallGroups",
        "WinJSTests.VirtualizedViewTests.testLazyTreeCreationPriority",
        "WinJSTests.VirtualizedViewTests.testMaxDeferredItemCleanup",
        "WinJSTests.VirtualizedViewTests.testNoFocusLossAfterDeleteCellSpanningLayout",
        "WinJSTests.VirtualizedViewTests.testNoFocusLossAfterDeleteGridLayout",
        "WinJSTests.VirtualizedViewTests.testNoFocusLossAfterDeleteListLayout",
        "WinJSTests.VirtualizedViewTests.testNoProgressRingInEmptyView",
        "WinJSTests.VirtualizedViewTests.testNoReparentingDuringEdits",
        "WinJSTests.VirtualizedViewTests.testPanningUsingAsyncDataSourceWithMultiStageRenderers",
        "WinJSTests.VirtualizedViewTests.testReadySignalOrder",
        "WinJSTests.VirtualizedViewTests.testReadySignalOrderWithSlowDataSource",
        "WinJSTests.VirtualizedViewTests.testRealizeMoreThanCreated",
        "WinJSTests.VirtualizedViewTests.testRealizeRetryDuringEdits",
        "WinJSTests.VirtualizedViewTests.testRebuildingStructureNodesAfterResize",
        "WinJSTests.VirtualizedViewTests.testResizeDuringLazyTreeCreation",
        "WinJSTests.VirtualizedViewTests.testResizeWithStructuralNodes",
        "WinJSTests.VirtualizedViewTests.testScrollAfterSkippedRealization",
        "WinJSTests.VirtualizedViewTests.testScrollDonotCancelAnimations",
        "WinJSTests.VirtualizedViewTests.testScrollingDuringLazyCreation",
        "WinJSTests.VirtualizedViewTests.testSerializeAnimations",
        "WinJSTests.VirtualizedViewTests.testSerializeRealizePasses",
        "WinJSTests.VirtualizedViewTests.testSingleDeleteUpdateFollowedByInserts",
        "WinJSTests.VirtualizedViewTests.testSlowHeaderRenderingDoesNotCrash",
        "WinJSTests.VirtualizedViewTests.testSlowHeaderRenderingDoesNotRenderDuplicateHeaders",
        "WinJSTests.VirtualizedViewTests.testStoppingLazyTreeCreation",
        "WinJSTests.VirtualizedViewTests.testSuppressCallbacksDuringScrolling",
        "WinJSTests.VirtualizedViewTests.testTogglingStructuralNodesDueToEdits",
        "WinJSTests.VirtualizedViewTests.testTreeUpdate",
        "WinJSTests.VirtualizedViewTests.testTreeUpdateWithStructureNodes",
        "WinJSTests.VirtualizedViewTests.testUninitialize",
        "WinJSTests.VirtualizedViewTests.testUpdateContainersUpdatesToAffectedRange",
        "WinJSTests.VirtualizedViewTests.testWaitingForItemRenderers",
    ]);
})();