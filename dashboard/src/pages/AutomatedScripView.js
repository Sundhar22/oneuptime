import React, { useEffect, useState } from 'react';
import Dashboard from '../components/Dashboard';
import Fade from 'react-reveal/Fade';
import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import PropTypes from 'prop-types';
import getParentRoute from '../utils/getParentRoute';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ShouldRender from '../components/basic/ShouldRender';
import { LoadingState } from '../components/basic/Loader';
import DeleteScriptBox from '../components/automationScript/DeleteScriptBox';
import DataPathHoC from '../components/DataPathHoC';
import ViewJsonLogs from '../components/modals/ViewJsonLogs';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { openModal } from '../actions/modal';
import { v4 as uuidv4 } from 'uuid';
import { fetchSingleAutomatedScript } from '../actions/automatedScript';
import Badge from '../components/common/Badge';
import moment from 'moment';

const AutomatedScripView = props => {
    const { history } = props;
    const pathName = history.location.pathname;
    const parentRoute = getParentRoute(history.location.pathname);
    const scriptName =
        pathName.split('automation-scripts/')[1].split('-')[0] || null;

    const [tabIndex, setTabIndex] = useState(0);
    const [viewJsonModalId] = useState(uuidv4());

    useEffect(() => {
        const projectId = props.currentProject?._id;
        const automatedSlug = props.match.params.automatedScriptslug;
        if (projectId) {
            props.fetchSingleAutomatedScript(projectId, automatedSlug, 0, 10);
        }
    }, [props.currentProject]);

    const tabSelected = index => {
        const tabSlider = document.getElementById('tab-slider');

        setTimeout(() => {
            tabSlider.style.transform = `translate(calc(${tabSlider.offsetWidth}px*${index}), 0px)`;
        });
        setTabIndex(index);
    };

    const scriptLogs = props.script;
    const requesting = props.requesting;
    const count = props.script && props.script.count;
    let skip = props.script && props.script.skip,
        limit = props.script && props.script.limit;

    if (skip && typeof skip === 'string') {
        skip = parseInt(skip, 10);
    }
    if (limit && typeof limit === 'string') {
        limit = parseInt(limit, 10);
    }
    if (!skip) skip = 0;
    if (!limit) limit = 0;

    let canNext = count && count > skip + limit ? true : false;
    let canPrev = skip <= 0 ? false : true;

    if (requesting || !scriptLogs) {
        canNext = false;
        canPrev = false;
    }

    const nextClicked = async () => {
        const projectId = props.currentProject && props.currentProject._id;
        const automatedSlug = props.match.params.automatedScriptslug;
        const skip = props.script && props.script.skip;
        await props.fetchSingleAutomatedScript(
            projectId,
            automatedSlug,
            parseInt(skip, 10) + 10,
            10
        );
    };

    const prevClicked = async () => {
        const projectId = props.currentProject && props.currentProject._id;
        const automatedSlug = props.match.params.automatedScriptslug;
        const skip = props.script && props.script.skip;
        await props.fetchSingleAutomatedScript(
            projectId,
            automatedSlug,
            parseInt(skip, 10) - 10,
            10
        );
    };
    return (
        <Dashboard>
            <Fade>
                <BreadCrumbItem route={parentRoute} name="Automation Scripts" />
                <BreadCrumbItem
                    route={history.location.pathname}
                    name={scriptName}
                    pageTitle="Automation Scripts"
                />
                <Tabs
                    selectedTabClassName={'custom-tab-selected'}
                    onSelect={tab => tabSelected(tab)}
                    selectedIndex={tabIndex}
                >
                    <div className="Flex-flex Flex-direction--columnReverse">
                        <TabList
                            id="customTabList"
                            className={'custom-tab-list'}
                        >
                            <Tab
                                className={
                                    'custom-tab custom-tab-6 basic-tab bs-automate-tab'
                                }
                            >
                                Basic
                            </Tab>
                            <Tab
                                className={
                                    'custom-tab custom-tab-6 advanced-options-tab bs-automate-tab'
                                }
                            >
                                Advanced Options
                            </Tab>
                            <div
                                id="tab-slider"
                                className="custom-tab-6 status-tab bs-automate-slider"
                            ></div>
                        </TabList>
                    </div>

                    <div className="Box-root">
                        <div>
                            <div>
                                <div className="db-BackboneViewContainer">
                                    <div className="react-settings-view react-view">
                                        <span data-reactroot="">
                                            <div>
                                                <div>
                                                    <ShouldRender if={true}>
                                                        <TabPanel>
                                                            <Fade>
                                                                <div className="bs-ContentSection Card-root Card-shadow--medium Margin-bottom--12">
                                                                    <div className="ContentHeader Box-root Box-background--white Box-divider--surface-bottom-1 Flex-flex Flex-direction--column Padding-horizontal--20 Padding-vertical--16">
                                                                        <div className="Box-root Flex-flex Flex-direction--row Flex-justifyContent--spaceBetween">
                                                                            <div className="ContentHeader-center Box-root Flex-flex Flex-direction--column Flex-justifyContent--center">
                                                                                <span className="ContentHeader-title Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--28 Text-typeface--base Text-wrap--wrap">
                                                                                    <span>
                                                                                        Automated
                                                                                        Script
                                                                                        Logs
                                                                                    </span>
                                                                                </span>
                                                                                <span className="ContentHeader-description Text-color--inherit Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                                    <span>
                                                                                        Here&#39;s
                                                                                        a
                                                                                        log
                                                                                        of
                                                                                        the
                                                                                        automated
                                                                                        scripts
                                                                                    </span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bs-ContentSection-content Box-root">
                                                                        <div className="bs-ObjectList db-UserList">
                                                                            <div
                                                                                style={{
                                                                                    overflow:
                                                                                        'hidden',
                                                                                    overflowX:
                                                                                        'auto',
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    id="automatedList"
                                                                                    className="bs-ObjectList-rows"
                                                                                >
                                                                                    <header className="bs-ObjectList-row bs-ObjectList-row--header">
                                                                                        <div className="bs-ObjectList-cell">
                                                                                            Triggered
                                                                                            by
                                                                                        </div>
                                                                                        <div className="bs-ObjectList-cell">
                                                                                            Time
                                                                                            the
                                                                                            script
                                                                                            ran
                                                                                        </div>
                                                                                        <div
                                                                                            className="bs-ObjectList-cell"
                                                                                            style={{
                                                                                                marginRight:
                                                                                                    '10px',
                                                                                            }}
                                                                                        >
                                                                                            Status
                                                                                        </div>
                                                                                        <div
                                                                                            className="bs-ObjectList-cell"
                                                                                            style={{
                                                                                                float:
                                                                                                    'right',
                                                                                            }}
                                                                                        >
                                                                                            Action
                                                                                        </div>
                                                                                    </header>
                                                                                    {scriptLogs &&
                                                                                        scriptLogs
                                                                                            .data
                                                                                            .length >
                                                                                            0 &&
                                                                                        scriptLogs.data.map(
                                                                                            (
                                                                                                log,
                                                                                                index
                                                                                            ) => {
                                                                                                return (
                                                                                                    <div
                                                                                                        key={
                                                                                                            index
                                                                                                        }
                                                                                                        className="scheduled-event-list-item bs-ObjectList-row db-UserListRow db-UserListRow--withName"
                                                                                                        style={{
                                                                                                            backgroundColor:
                                                                                                                'white',
                                                                                                            cursor:
                                                                                                                'pointer',
                                                                                                        }}
                                                                                                    >
                                                                                                        <div className="bs-ObjectList-cell bs-u-v-middle bs-ActionsParent">
                                                                                                            <div className="bs-ObjectList-cell-row bs-ObjectList-copy bs-is-highlighted">
                                                                                                                <ShouldRender
                                                                                                                    if={
                                                                                                                        log.triggerByUser
                                                                                                                    }
                                                                                                                >
                                                                                                                    {
                                                                                                                        log
                                                                                                                            .triggerByUser
                                                                                                                            ?.name
                                                                                                                    }
                                                                                                                </ShouldRender>
                                                                                                                <ShouldRender
                                                                                                                    if={
                                                                                                                        log.triggerByScript
                                                                                                                    }
                                                                                                                >
                                                                                                                    {
                                                                                                                        log
                                                                                                                            .triggerByScript
                                                                                                                            ?.name
                                                                                                                    }
                                                                                                                </ShouldRender>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="bs-ObjectList-cell bs-u-v-middle">
                                                                                                            <div
                                                                                                                className="bs-ObjectList-cell-row"
                                                                                                                id={`monitor`}
                                                                                                            >
                                                                                                                {moment(
                                                                                                                    log.createdAt
                                                                                                                ).format(
                                                                                                                    'MMMM Do YYYY, h:mm a'
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="bs-ObjectList-cell bs-u-v-middle">
                                                                                                            <div className="Box-root">
                                                                                                                {log.status ===
                                                                                                                'success' ? (
                                                                                                                    <Badge color="green">
                                                                                                                        {
                                                                                                                            log.status
                                                                                                                        }
                                                                                                                    </Badge>
                                                                                                                ) : log.status ===
                                                                                                                  'running' ? (
                                                                                                                    <Badge color="yellow">
                                                                                                                        {
                                                                                                                            log.status
                                                                                                                        }
                                                                                                                    </Badge>
                                                                                                                ) : log.status ===
                                                                                                                  'failure' ? (
                                                                                                                    <Badge color="red">
                                                                                                                        {
                                                                                                                            log.status
                                                                                                                        }
                                                                                                                    </Badge>
                                                                                                                ) : null}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div
                                                                                                            className="bs-ObjectList-cell bs-u-v-middle"
                                                                                                            style={{
                                                                                                                display:
                                                                                                                    'flex',
                                                                                                                justifyContent:
                                                                                                                    'flex-end',
                                                                                                                alignItems:
                                                                                                                    'center',
                                                                                                                paddingTop:
                                                                                                                    '20px',
                                                                                                            }}
                                                                                                        >
                                                                                                            <div className="Box-root">
                                                                                                                <button
                                                                                                                    title="view log"
                                                                                                                    id={`automated_log_json_`}
                                                                                                                    disabled={
                                                                                                                        false
                                                                                                                    }
                                                                                                                    className="bs-Button bs-DeprecatedButton Margin-left--8"
                                                                                                                    type="button"
                                                                                                                    onClick={() =>
                                                                                                                        props.openModal(
                                                                                                                            {
                                                                                                                                id: viewJsonModalId,
                                                                                                                                content: DataPathHoC(
                                                                                                                                    ViewJsonLogs,
                                                                                                                                    {
                                                                                                                                        viewJsonModalId,
                                                                                                                                        jsonLog: {
                                                                                                                                            script:
                                                                                                                                                'jdjjd',
                                                                                                                                        },
                                                                                                                                        title: `Automated Script Log`,
                                                                                                                                        rootName:
                                                                                                                                            'automatedScript',
                                                                                                                                    }
                                                                                                                                ),
                                                                                                                            }
                                                                                                                        )
                                                                                                                    }
                                                                                                                >
                                                                                                                    <span>
                                                                                                                        View
                                                                                                                        Log
                                                                                                                    </span>
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            }
                                                                                        )}
                                                                                </div>
                                                                                <ShouldRender
                                                                                    if={
                                                                                        scriptLogs &&
                                                                                        scriptLogs
                                                                                            .data
                                                                                            .length ===
                                                                                            0
                                                                                    }
                                                                                >
                                                                                    <div
                                                                                        style={{
                                                                                            textAlign:
                                                                                                'center',
                                                                                            padding:
                                                                                                '12px',
                                                                                        }}
                                                                                    >
                                                                                        You&#39;ve
                                                                                        no
                                                                                        log
                                                                                        currently
                                                                                    </div>
                                                                                </ShouldRender>
                                                                                <div className="Box-root Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween">
                                                                                    <div className="Box-root Flex-flex Flex-alignItems--center Padding-all--20">
                                                                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                                            <span>
                                                                                                <span className="Text-color--inherit Text-display--inline Text-fontSize--14 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                                                    <ShouldRender
                                                                                                        if={
                                                                                                            count
                                                                                                        }
                                                                                                    >
                                                                                                        <span id="numberOfLogs">
                                                                                                            {
                                                                                                                count
                                                                                                            }
                                                                                                        </span>{' '}
                                                                                                        {count &&
                                                                                                        count >
                                                                                                            1
                                                                                                            ? 'Logs'
                                                                                                            : 'Log'}
                                                                                                    </ShouldRender>
                                                                                                </span>
                                                                                            </span>
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="Box-root Padding-horizontal--20 Padding-vertical--16">
                                                                                        <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart">
                                                                                            <div className="Box-root Margin-right--8">
                                                                                                <button
                                                                                                    id="btnPrevSubscriber"
                                                                                                    onClick={
                                                                                                        prevClicked
                                                                                                    }
                                                                                                    className={
                                                                                                        'Button bs-ButtonLegacy'
                                                                                                    }
                                                                                                    disabled={
                                                                                                        !canPrev
                                                                                                    }
                                                                                                    data-db-analytics-name="list_view.pagination.previous"
                                                                                                    type="button"
                                                                                                >
                                                                                                    <div className="Button-fill bs-ButtonLegacy-fill Box-root Box-background--white Flex-inlineFlex Flex-alignItems--center Flex-direction--row Padding-horizontal--8 Padding-vertical--4">
                                                                                                        <span className="Button-label Text-color--default Text-display--inline Text-fontSize--14 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--base Text-wrap--noWrap">
                                                                                                            <span>
                                                                                                                Previous
                                                                                                            </span>
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </button>
                                                                                            </div>
                                                                                            <div className="Box-root">
                                                                                                <button
                                                                                                    id="btnNextSubscriber"
                                                                                                    onClick={
                                                                                                        nextClicked
                                                                                                    }
                                                                                                    className={
                                                                                                        'Button bs-ButtonLegacy'
                                                                                                    }
                                                                                                    disabled={
                                                                                                        !canNext
                                                                                                    }
                                                                                                    data-db-analytics-name="list_view.pagination.next"
                                                                                                    type="button"
                                                                                                >
                                                                                                    <div className="Button-fill bs-ButtonLegacy-fill Box-root Box-background--white Flex-inlineFlex Flex-alignItems--center Flex-direction--row Padding-horizontal--8 Padding-vertical--4">
                                                                                                        <span className="Button-label Text-color--default Text-display--inline Text-fontSize--14 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--base Text-wrap--noWrap">
                                                                                                            <span>
                                                                                                                Next
                                                                                                            </span>
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Fade>
                                                        </TabPanel>
                                                        <TabPanel>
                                                            <Fade>
                                                                <DeleteScriptBox
                                                                    {...props}
                                                                    name={
                                                                        scriptName
                                                                    }
                                                                    parentRoute={
                                                                        parentRoute
                                                                    }
                                                                />
                                                            </Fade>
                                                        </TabPanel>
                                                    </ShouldRender>
                                                    <ShouldRender if={false}>
                                                        <LoadingState />
                                                    </ShouldRender>
                                                </div>
                                            </div>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </Fade>
        </Dashboard>
    );
};

AutomatedScripView.propTypes = {
    history: PropTypes.object.isRequired,
    openModal: PropTypes.func,
    fetchSingleAutomatedScript: PropTypes.func,
    currentProject: PropTypes.object,
    match: PropTypes.object,
    script: PropTypes.object,
    location: PropTypes.object,
    requesting: PropTypes.bool,
};

const mapStateToProps = state => ({
    currentProject: state.project.currentProject,
    script: state.automatedScripts.individualScript.log,
    requesting: state.automatedScripts.individualScript.requesting,
});

const mapDispatchToProps = dispatch =>
    bindActionCreators({ openModal, fetchSingleAutomatedScript }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(AutomatedScripView);
